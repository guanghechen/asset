/**
 * Async task
 */
export interface AsyncTask<D extends unknown = unknown> {
  /**
   * Task data
   */
  data: D
  /**
   * Execute task
   */
  execute: () => (void | Promise<void>)
}


/**
 * Executor to execute asynchronous tasks serially
 */
export interface SerialExecutor<D extends unknown = unknown> {
  /**
   * Append task to executor
   */
  addTask: (task: AsyncTask<D>) => void
}


/**
 * Create a SerialExecutor to execute asynchronous tasks serially
 *
 * @param squashable      check if current task could be skipped
 * @param onTaskSuccess   triggered on each task finished
 * @param onTaskFailure   triggered on each task crashed
 * @param onTaskCompleted triggered on each task terminated (finished / crashed)
 */
export function createSerialExecutor<D extends unknown = unknown>(
  squashable?: (currentData: D, nextData: D) => boolean,
  onTaskSuccess?: () => void | Promise<void>,
  onTaskFailure?: (error: any) => void | Promise<void>,
  onTaskCompleted?: (error?: any) => void | Promise<void>,
): SerialExecutor<D> {
  let running = false
  const tasks: AsyncTask<D>[] = []

  const runTask = async () => {
    // If running or no task remain, no operation will be performed
    if (running || tasks.length <= 0) return

    // Ready to start task
    running = true
    const task = tasks.shift()!

    // Optimization: check if current task could be skipped
    if (tasks.length > 0) {
      const nextTask = tasks[0]
      if (squashable != null && squashable(task.data, nextTask.data)) {
        running = false
        await runTask()
        return
      }
    }

    let error: any | undefined
    try {
      await task.execute()
    } catch (err) {
      error = err
    } finally {
      // Run hooks
      if (error != null) {
        if (onTaskFailure) {
          await onTaskFailure(error)
        } else {
          throw error
        }
      } else {
        if (onTaskSuccess) await onTaskSuccess()
      }
      if (onTaskCompleted) await onTaskCompleted(error)

      // Release lock
      running = false

      // Start next task
      if (tasks.length > 0) await runTask()
    }
  }

  const addTask = (task: AsyncTask<D>) => {
    tasks.push(task)
    runTask()
  }

  return { addTask }
}
