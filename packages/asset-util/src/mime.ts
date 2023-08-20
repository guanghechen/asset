import mime from 'mime'

mime.define(
  {
    'text/x-c++src': ['cpp'],
    'text/x-c++hdr': ['hpp'],
  },
  true,
)

export { mime }
