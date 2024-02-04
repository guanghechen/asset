/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Mime } from 'mime'
// @ts-expect-error
import otherTypes from 'mime/types/other.js'
// @ts-expect-error
import standardTypes from 'mime/types/standard.js'

export const mime = new Mime(standardTypes, otherTypes)
mime.define(
  {
    'text/x-c++src': ['cpp'],
    'text/x-c++hdr': ['hpp'],
  },
  true,
)
