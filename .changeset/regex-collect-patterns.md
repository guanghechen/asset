---
"@guanghechen/asset-api": major
"@guanghechen/asset-storage-file": major
"@guanghechen/asset-storage-memo": major
"@guanghechen/asset-types": major
---

Replace string glob patterns in `collect()` and `buildByPatterns()` with regular expressions matched
against normalized absolute source paths. File collection now skips symbolic-link entries.
