import invariant from '@guanghechen/invariant'

export enum TaskPipelineStatus {
  /**
   * The task pipeline is in pending state.
   */
  PENDING = 'pending',
  /**
   * Once a running task finished, it will peek the front task from the task queue
   * and start it automatically.
   */
  AUTO_RUNNING = 'auto-running',
  /**
   * The task pipeline is pausing running, no new task will be automatic running.
   */
  PAUSED = 'paused',
  /**
   * The task pipeline is cancelled, once in this state,
   * the TaskPipeline cannot change its status anymore.
   */
  CANCELLED = 'cancelled',
}

export interface ITask<T extends string = string, P = unknown> {
  /**
   * Task type.
   */
  type: T
  /**
   * Task payload.
   */
  payload: P
}

export interface ITaskPipelineProps<A extends ITask> {
  /**
   * Process the given task.
   * @param task
   */
  handleTask(task: Readonly<A>): void | Promise<void>
  /**
   * Check if the current task could be skipped.
   * @param task
   * @param nextTask
   */
  isSquashable?(task: Readonly<A>, nextTask: Readonly<A>): boolean
  /**
   * Callback once a task finished successfully.
   * @param task
   */
  onTaskSucceed?(task: Readonly<A>): void | Promise<void>
  /**
   * Callback once a task failed.
   * @param task
   * @param error
   */
  onTaskFailure?(task: Readonly<A>, error: unknown): void | Promise<void>
  /**
   * Callback once a task finished the processing.
   * @param task
   * @param error
   */
  onTaskFinished?(task: Readonly<A>, error?: unknown): void | Promise<void>
}

export class TaskPipeline<A extends ITask> {
  protected readonly tasks: A[] = []
  protected readonly handleTask: (task: Readonly<A>) => void | Promise<void>
  protected readonly isSquashable: (task: Readonly<A>, nextTask: Readonly<A>) => boolean
  protected readonly onTaskSucceed: (task: Readonly<A>) => void | Promise<void>
  protected readonly onTaskFailure: (task: Readonly<A>, error: unknown) => void | Promise<void>
  protected readonly onTaskFinished: (task: Readonly<A>, error?: unknown) => void | Promise<void>

  protected status: TaskPipelineStatus
  protected running: boolean
  // Don't use this field to check if there is a task running.
  // If you want to find if there is a task running, please use the `running` flag instead.
  protected _runningPromise: Promise<void> | null

  constructor(props: ITaskPipelineProps<A>) {
    this.handleTask = props.handleTask
    this.isSquashable = props.isSquashable ?? (() => false)
    this.onTaskSucceed = props.onTaskSucceed ?? (() => {})
    this.onTaskFailure =
      props.onTaskFailure ??
      ((task, error) => {
        const details = JSON.stringify(task.payload)
        throw new Error(`Failed to handle task. ${task.type}: ${details}`, {
          cause: error instanceof Error ? error : new Error(String(error)),
        })
      })
    this.onTaskFinished =
      props.onTaskFinished ??
      ((task, error) => {
        if (error != null) {
          const details = JSON.stringify(task.payload)
          throw new Error(`Failed to handle task. ${task.type}: ${details}`, {
            cause: error instanceof Error ? error : new Error(String(error)),
          })
        }
      })

    this.status = TaskPipelineStatus.PENDING
    this.running = false
    this._runningPromise = null
  }

  public async run(): Promise<void> {
    invariant(
      this.status !== TaskPipelineStatus.CANCELLED,
      'Failed to run task: task pipeline is already cancelled.',
    )
    this.status = TaskPipelineStatus.AUTO_RUNNING
    await this.automaticRunTask()
  }

  public async pause(): Promise<void> {
    invariant(
      this.status !== TaskPipelineStatus.CANCELLED,
      'Failed to pause task: task pipeline is already cancelled.',
    )
    this.status = TaskPipelineStatus.PAUSED
    await this._runningPromise
  }

  public async cancel(): Promise<void> {
    this.status = TaskPipelineStatus.CANCELLED
    await this._runningPromise
  }

  public addTask(task: A): void {
    invariant(this.status !== TaskPipelineStatus.CANCELLED, () => {
      const details = JSON.stringify(task.payload)
      return `Failed to add task(${task.type}): task pipeline is already cancelled.\ndetails: ${details}`
    })
    this.tasks.push(task)
    if (this.status === TaskPipelineStatus.AUTO_RUNNING) void this.automaticRunTask()
  }

  protected async automaticRunTask(): Promise<void> {
    if (this.status !== TaskPipelineStatus.AUTO_RUNNING || this.running) return

    const task = this.tasks.shift()
    if (task === undefined) return

    // Optimization: check if the current task could be skipped.
    if (this.tasks.length > 0) {
      const nextTask = this.tasks[0]
      if (this.isSquashable(task, nextTask)) {
        await this.automaticRunTask()
        return
      }
    }

    const runTask = async (): Promise<void> => {
      let error: unknown | undefined
      try {
        await this.handleTask(task)
        await this.onTaskSucceed(task)
      } catch (err) {
        error = err
        await this.onTaskFailure(task, error)
      } finally {
        await this.onTaskFinished(task, error)
      }
    }

    this.running = true
    this._runningPromise = runTask().finally(() => {
      this.running = false
      this._runningPromise = null
    })

    await this._runningPromise
    await this.automaticRunTask()
  }
}
