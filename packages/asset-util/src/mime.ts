import { Mime } from 'mime'
import otherTypes from 'mime/types/other.js'
import standardTypes from 'mime/types/standard.js'

export const mime = new Mime(standardTypes, otherTypes)
mime.define(
  {
    'text/x-c++src': ['cpp'],
    'text/x-c++hdr': ['hpp'],
  },
  true,
)
