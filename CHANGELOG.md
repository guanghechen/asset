# Changelog

<a name="1.0.0-alpha.6"></a>
## 1.0.0-alpha.6 (2023-03-11)

### Changed

- 🔧 chore: fix lint [[d779e47](https://github.com/guanghechen/asset/commit/d779e473bea4d511a0813b370bb12053ee545fa1)]
- 🔧 chore: support ESM [[b82cd18](https://github.com/guanghechen/asset/commit/b82cd1840f27dfcd0a4dd44d3371fdd60da643d8)]
- ⬆️ chore: upgrade dependencies [[54369ae](https://github.com/guanghechen/asset/commit/54369ae56dc4e07ee52553f5bdfc69f0fcfb6df2)]
- 🔧 chore: fix npm script [[12bc24a](https://github.com/guanghechen/asset/commit/12bc24a61a86317eb07894892f0ee752029f6ca9)]
- 🔧 chore: fix test configs [[1358b71](https://github.com/guanghechen/asset/commit/1358b71cc7d5d0ff322a7130ce3d2a8b9868f7a0)]
- 🔧 chore: fix build errors [[13c064e](https://github.com/guanghechen/asset/commit/13c064efebac4097881bac8e3d4ffbd1aeb1b0ef)]
- 🔧 chore: use yarn@3 [[06e17b3](https://github.com/guanghechen/asset/commit/06e17b3a610691b6aaf96b3bccf92ce7ee334025)]
- ⬆️ chore: upgrade dependencies [[a1f7e71](https://github.com/guanghechen/asset/commit/a1f7e71c98f986b4fec22947333a4e47add03286)]


<a name="1.0.0-alpha.5"></a>
## 1.0.0-alpha.5 (2022-10-14)

### Added

- ✨ feat: support definitionMap and footnoteDefinitionMap [[15be0bf](https://github.com/guanghechen/asset/commit/15be0bfae129a0e6228ec6f43795347813eda47d)]

### Changed

- 🎨 improve: move some types from &#x27;asset-core-parser&#x27; to &#x27;asset-core&#x27; [[14110c2](https://github.com/guanghechen/asset/commit/14110c23665f3e5d6d00911108bf7f93a3555735)]
- ⬆️ chore: upgrade dependencies [[dfaa097](https://github.com/guanghechen/asset/commit/dfaa097a51e103dcd1982f03dfd61ef03f803f49)]
- 🔧 chore: update build scripts [[20ad4cd](https://github.com/guanghechen/asset/commit/20ad4cd1847361177774a28520533b6953d3c22e)]
- 🎨 improve: rename IAssetParserPlugin to IAssetPlugin [[8428b0d](https://github.com/guanghechen/asset/commit/8428b0da73da318480bc014e17c1def69e690c28)]

### Breaking changes

- 💥 rename asset-core-parser to asset-core-plugin &amp; rename classes [[8d2402c](https://github.com/guanghechen/asset/commit/8d2402cfb22c156072966320002754474f75cc1b)]

### Fixed

- 🐛 fix: use stat.birthtime instead of stat.ctime to represent the asset createAt [[4f4ca49](https://github.com/guanghechen/asset/commit/4f4ca49587cd68a2c76a5c52a6b2844f9b5e4432)]
- ✏️ improve: fix typos [[0368ba3](https://github.com/guanghechen/asset/commit/0368ba3010663dfce8adf97f0a1c9f0de452a0b3)]

### Miscellaneous

-  improve: fix types [[1064365](https://github.com/guanghechen/asset/commit/10643653f0efec14984412c5730706173b07d9bd)]
-  feat: add &#x27;description&#x27; to AssetMap [[15c6b78](https://github.com/guanghechen/asset/commit/15c6b785dccd6c12432b2ad00636bf153c225b3a)]


<a name="1.0.0-alpha.4"></a>
## 1.0.0-alpha.4 (2022-10-10)

### Added

- ✨ feat: support excerpt, toc and timeToRead for Markdown asset data [[d2ee634](https://github.com/guanghechen/asset/commit/d2ee6343a71f5877a1e9a46d995bbdd520ee80c9)]

### Changed

- 🔧 chore: tweak &#x27;asset-build&#x27; script [[ddba2e4](https://github.com/guanghechen/asset/commit/ddba2e47b5e5126be4a9b18b999f8a6137a24bfd)]
- 🔧 chore: update scripts [[334d9b4](https://github.com/guanghechen/asset/commit/334d9b43784da5108de50e20c3115be3f265afe6)]
- ⬆️ chore: upgrade dependencies [[7decae2](https://github.com/guanghechen/asset/commit/7decae21b8cda7a6d6a14fd96d08553b74ec14f3)]
- 🔧 chore: update scripts [[753897a](https://github.com/guanghechen/asset/commit/753897adec00d835450b63379f51b78776a30dd6)]
- ⬆️ chore: upgrade dependencies [[fe38fa4](https://github.com/guanghechen/asset/commit/fe38fa4bbaf223c1b09d96f8cebae19bafb07bae)]
- 🔧 chore: set npm registry [[583463a](https://github.com/guanghechen/asset/commit/583463ac8d9d921a19099cc6cf34fdcd811a8bbb)]
- 🎨 improve: update asset-build script [[c7a5f55](https://github.com/guanghechen/asset/commit/c7a5f555947c4bdb51315ea36329c75028f03df5)]

### Miscellaneous

- 📄 doc: update LICENSE [[3596861](https://github.com/guanghechen/asset/commit/3596861246c2b713ae6e044d70d3c24eb01a76a3)]


<a name="1.0.0-alpha.3"></a>
## 1.0.0-alpha.3 (2022-07-30)

### Added

- ✨ feat: support watch mode [[610f82c](https://github.com/guanghechen/asset/commit/610f82cccfcdbf787b52ee32b98138df25e21267)]
- ✨ feat: implement AssetManager [[14dd9c5](https://github.com/guanghechen/asset/commit/14dd9c51d209cf48fe67af7f563efb747ee267af)]
- ✨ feat: add @guanghechen/asset-core-service [[635af0e](https://github.com/guanghechen/asset/commit/635af0e65d8ef10e890f0ea1c184dea725767417)]
- ✨ feat: add asset-plugin-markdown [[2fc1136](https://github.com/guanghechen/asset/commit/2fc1136ff352cf3194fd075dd55f3377ed3ab60f)]
- ✨ feat(asset-core): add AssetService [[286caa9](https://github.com/guanghechen/asset/commit/286caa9a8f65eb6a7769882bd1b5524f6e8de988)]
- ✨ feat: new sub-package @guanghechen/asset-core [[9a64623](https://github.com/guanghechen/asset/commit/9a646238153842b027eb14e8e70f13d1b4a18718)]

### Changed

- ⬆️ chore: upgrade dependencies [[0a567cb](https://github.com/guanghechen/asset/commit/0a567cbf0e7016d89861b854062a87f56f7380cb)]
- 🍱 asset: update demo [[05c1008](https://github.com/guanghechen/asset/commit/05c10086cc353679f17d5362865dd60c08e7ae3b)]
- 🎨 improve: Wait a few million seconds after file content changed [[e3c2771](https://github.com/guanghechen/asset/commit/e3c27715fc763255386d8e4e555e7bb97bf39c29)]
- 🎨 improve: use resolveUrlPathPrefix to generate url prefix for different type assets [[9861264](https://github.com/guanghechen/asset/commit/9861264d7be6995378ccf15bda947dd72b147f11)]
- 🎨 improve: add AssetService [[3bdab1b](https://github.com/guanghechen/asset/commit/3bdab1bcbb4afcf6077106e1d67d54a550fa4976)]
- 🔧 chore: update bundle configs [[7858989](https://github.com/guanghechen/asset/commit/7858989e2894abdec29da0daa2e2a97f1a80893c)]
- 🔧 chore: remove unnecessary dependencies [[e15edd6](https://github.com/guanghechen/asset/commit/e15edd6fc2476a4946706347b306683fbd9f0507)]
- 🎨 refactor: rename asset plugins [[a2b2c61](https://github.com/guanghechen/asset/commit/a2b2c612f2c23ce3f273a67d890eee33cb1aa962)]
- 🎨 refactor: abstract asset-parser logic into @guanghechen/asset-core-plugin [[7941651](https://github.com/guanghechen/asset/commit/79416516305b0ba415ee06642790295aba78b1ae)]
- 🎨 refactor: refactor resolveSlug &amp; rename it to resolveUrlPath [[12f62b3](https://github.com/guanghechen/asset/commit/12f62b34cd132913955fabee3b86fdc3684bcf1e)]
- 🎨 refactor: refactor AssetService interfaces [[2b01bf0](https://github.com/guanghechen/asset/commit/2b01bf077b8859aef782c0dfe341c240c79b331d)]
- 🎨 feat: add MarkdownAssetPluginSlug [[8bc51d2](https://github.com/guanghechen/asset/commit/8bc51d2458afb7cf92e03037a8f8de2babcd458a)]
- 🍱 asset: update demo [[1348efe](https://github.com/guanghechen/asset/commit/1348efedab557d23dee4b29bfa7f612a341c12a5)]
- 🎨 improve: support to use multiple plugins [[3212ef1](https://github.com/guanghechen/asset/commit/3212ef167b0e37f024d8bca3cc4978192e67b572)]
- 🎨 improve(markdown): add new plugins to handle code and footnote [[dd91873](https://github.com/guanghechen/asset/commit/dd91873cb217eef650f6bdcab9837fd7f7908807)]
- 🎨 improve: support loadContent synchronously [[538bd42](https://github.com/guanghechen/asset/commit/538bd42ca504f098ab7945505bece65f5db05cc3)]
- 🎨 improve: rename variables [[7f944de](https://github.com/guanghechen/asset/commit/7f944de16e8b248020203056a42d1bb0d9407db7)]
- 🍱 asset: move script/_fixtures to script/fixtures [[bfae046](https://github.com/guanghechen/asset/commit/bfae0464588ed70cc85f2bd0a195896fa6fdeb41)]
- 🔧 chore: update bundle configs [[56d9f74](https://github.com/guanghechen/asset/commit/56d9f74bb4af7a086effcbf506155f5bbe51ff47)]
- 🍱 asset: add asset-build demo [[5e02bd5](https://github.com/guanghechen/asset/commit/5e02bd5cc6b042ef9fdc89a7c90ce5edbcf0fe00)]
- 🎨 improve: use third-party lib &#x27;mime&#x27; to simplify codes [[52c4627](https://github.com/guanghechen/asset/commit/52c46279c19b08df70cfa47facff5691056c8e39)]
- 🎨 improve: keep middlewares simple [[c304f05](https://github.com/guanghechen/asset/commit/c304f05b4279cb544d08f5b32678eb5f0f4e0b1d)]
- 🎨 improve: support to customize guid namespace [[6f2d56b](https://github.com/guanghechen/asset/commit/6f2d56bbe478b1d9862cf23216c7c69843cd795c)]
- 🎨 refactor: support more liberal middleware style [[2969816](https://github.com/guanghechen/asset/commit/296981683688c5835ae03dbe12d216987738d652)]
- 🎨 improve: tweak interface &amp; fix known issues [[9c5cf3e](https://github.com/guanghechen/asset/commit/9c5cf3e1de5cf6b1e3d416b99938c08d650fc0df)]
- 🎨 refactor(asset-plugin-file): prefer single file [[c619b08](https://github.com/guanghechen/asset/commit/c619b080268ed3854edcd12e2f3b857946e6c30c)]
- 🎨 improve(asset-plugin-markdown): try next middleware even the current plugin resolved [[f0a1922](https://github.com/guanghechen/asset/commit/f0a192235ae71b63988281980ff707d4152c7454)]
- 🚨 style: fix lint warnings [[beb065e](https://github.com/guanghechen/asset/commit/beb065e9f19f318c35d5396870088324c3b684a8)]
- 🎨 improve: resolve relative reference urls [[9052115](https://github.com/guanghechen/asset/commit/9052115ac7ec2197fb71135be39e8057a3448eab)]
- ⬆️ chore: upgrade dependencies [[b3989bf](https://github.com/guanghechen/asset/commit/b3989bf25d65dda1e3973731033008329a4ef2ab)]
- 🔧 chore: update yarn.lock [[9422d49](https://github.com/guanghechen/asset/commit/9422d49709b0abde9901f9a4a6cd154a9abead82)]
- 🎨 refactor: move asset-file to asset-plugin-file &amp; rewrite it [[03e5589](https://github.com/guanghechen/asset/commit/03e55899061e13233728f50eeea47655b6b179fc)]
- 🎨 improve: prefer &#x27;Buffer&#x27; instead of custom type &#x27;IBuffer&#x27; [[9e9abe1](https://github.com/guanghechen/asset/commit/9e9abe10494a5159e75d7cd2e6332256dd574eeb)]
- 🎨 refactor: rewrite AssetService and AssetManager [[7defa71](https://github.com/guanghechen/asset/commit/7defa710c03127cb69b5d67a734b48b48219f9f1)]
- 🎨 improve: make code clean [[a15fcfc](https://github.com/guanghechen/asset/commit/a15fcfc8dfbe13806113583a649bfc3958137a3a)]
- ⬆️ chore: upgrade dependencies [[589476c](https://github.com/guanghechen/asset/commit/589476cb2d8d330c4acf736e3ffc1554ebec47c7)]
- 🎨 refactor: rewrite AssetService [[f286ef9](https://github.com/guanghechen/asset/commit/f286ef923962fa983d1cde5e66fcbe9202445966)]
- 🎨 feat: add TaskPipeline [[416a595](https://github.com/guanghechen/asset/commit/416a5956783ff8959eb0b02cf316c58b950a94d0)]
- 🎨 mod(asset-plugin-markdown): update with @guanghechen/asset-core-service [[f583165](https://github.com/guanghechen/asset/commit/f5831655fbe736671db3e1d4cf8fc12a2e483945)]
- 🎨 mod: update AssetService with AssetManager [[45acd33](https://github.com/guanghechen/asset/commit/45acd3302c5625809b58a8fd376598ee3dc0f956)]
- 🎨 refactor: rewrite TagManager and CategoryManager [[95bf4db](https://github.com/guanghechen/asset/commit/95bf4dbf8b3bf6c9237519cbfc1e1cd6c9500652)]
- 🎨 refactor: rewrite asset-core [[c02462c](https://github.com/guanghechen/asset/commit/c02462c4f0e047bb682fef56400d6f1bd9ffd933)]
- ⬆️ chore: upgrade dependencies &amp; fix lint errors [[87da004](https://github.com/guanghechen/asset/commit/87da004497394d21b6f3fcf12b08873d5b77608c)]

### Removed

- 🔥 remove: remove package &#x27;@guanghechen/site-api&#x27; [[1a09e6e](https://github.com/guanghechen/asset/commit/1a09e6eb673bca1ae21c5e9929130080ada868fa)]
- 🔥 remove asset-markdown [[ab2d96d](https://github.com/guanghechen/asset/commit/ab2d96d0710de0f11ea445b43701ff5220538030)]
- 🔥 remove asset-markdown-parser [[376a89b](https://github.com/guanghechen/asset/commit/376a89b453b6e244247cc682279a426b323a504f)]

### Fixed

- 🐛 fix: fix incorrect path in FileAssetParser.polish [[08bedeb](https://github.com/guanghechen/asset/commit/08bedeb3ff515e163fcc0f4bfc2e3a0b3ef4d612)]

### Miscellaneous

-  Rename repository to asset [[4a77a20](https://github.com/guanghechen/asset/commit/4a77a20cb72c53a56a8e22bce7325818f77eac7f)]
- ⚰️ improve: remove dead packages [[f98a32e](https://github.com/guanghechen/asset/commit/f98a32e230a77fe3d1a76ae22457f953e1e402fa)]
- 📝 docs: rename author [[e4fe5ef](https://github.com/guanghechen/asset/commit/e4fe5effbc62b33578b02ed93073c51b356c8972)]


<a name="1.0.0-alpha.2"></a>
## 1.0.0-alpha.2 (2021-07-23)

### Changed

- 🔧 chore: rename default branch from master to main [[4b67b56](https://github.com/guanghechen/asset/commit/4b67b5698c44971903a0da45ca93407819b32aef)]
- 👽 improve: update due to the previous upgrades [[b1e42b8](https://github.com/guanghechen/asset/commit/b1e42b8cc2068aadba7ecc5f031dd795cd8b36aa)]
- ⬆️ chore: upgrade dependencies &amp; fix lint errors [[0afca09](https://github.com/guanghechen/asset/commit/0afca09fba381d0eb493c4a3cbce9a6db736bf30)]

### Fixed

- 🐛 improve: fix type errors [[6cf899a](https://github.com/guanghechen/asset/commit/6cf899a05048abfc2ec7342da189e04472fd8426)]

### Miscellaneous

-  :white_check_test:  test: remove volatile datetime in snapshots [[2ce9320](https://github.com/guanghechen/asset/commit/2ce93204289b0f2502d68ff2551f3a22c46d5296)]


<a name="1.0.0-alpha.0"></a>
## 1.0.0-alpha.0 (2021-03-20)

### Added

- ✅ test(asset-markdown-parser): update tests [[7320124](https://github.com/guanghechen/static-site-api/commit/7320124c3be5e14c0f5c72f738c7c7fd9402892b)]
- ✨ feat: implement @guanghechen/asset-file for handling file assets [[94f86fa](https://github.com/guanghechen/static-site-api/commit/94f86facd43447e8bdc9b810b1eab542a491557e)]
- ✅ test(site-api): strip ansi colors case  the  will remove colors [[0dd9be1](https://github.com/guanghechen/static-site-api/commit/0dd9be155d7fedcf2d7da6851875606491e26625)]
- ✅ test: add empty tests for muting jest error [[2d21828](https://github.com/guanghechen/static-site-api/commit/2d21828c28225bedd5b2cad0c69b3ba9938e28bc)]
- ✅ [asset-markdown] test: add tests [[2098a19](https://github.com/guanghechen/static-site-api/commit/2098a194919e82ea12b230e2f9a4bce61d340a27)]
- ✅ [site-api] test: add tests for AssetDataProvider [[68e7cf0](https://github.com/guanghechen/static-site-api/commit/68e7cf086744a9a23c77c270d5d211b53e16ede2)]
- ✅ [site-api] test: add tests for config utils [[d195e83](https://github.com/guanghechen/static-site-api/commit/d195e834c95aec4a11362fa87b9d0f59e9a0b652)]
- ➕ [site-api] chore: add missed dependencies [[4d25183](https://github.com/guanghechen/static-site-api/commit/4d251837ef366e73b0c6686b84ccffb212371ef7)]
- 🎉 initialize. [[db69562](https://github.com/guanghechen/static-site-api/commit/db69562efe4d28797c2c30b39ce1a93940b93cd7)]

### Changed

- 🔧 chore: use gitmoji-changelog to generate CHANGELOG [[c45d579](https://github.com/guanghechen/static-site-api/commit/c45d579465c901a42b65efa94224193110a5d871)]
- ⬆️ chore: upgrade devDependencies [[e964fda](https://github.com/guanghechen/static-site-api/commit/e964fda8f2f5ad4e4ed6f0f153783e2ef075eb6b)]
- ⬆️ chore: upgrade @yozora/parser-gfm to 1.0.0-alpha.11 [[8696c81](https://github.com/guanghechen/static-site-api/commit/8696c81641817449cf4a19b4311c34472633d084)]
- 🔧 chore: upgrade dependencies &amp; update configs &amp; lint codes [[68f1ff1](https://github.com/guanghechen/static-site-api/commit/68f1ff1c643c02f0ba3e409db1fe91df23c094c3)]
- 🔧 chore: update jest config [[3641670](https://github.com/guanghechen/static-site-api/commit/36416709cfbd2935a52834fbca633f93973624f5)]
- 🔧 chore: add github workflow &amp; add .nvmrc [[b16da18](https://github.com/guanghechen/static-site-api/commit/b16da181fbda2818f6cd1a6d28d180b265c6b1c1)]
- ⬆️ chore: upgrade @yozora/parser-gfm to 1.0.0-alpha.8 [[ebb15ce](https://github.com/guanghechen/static-site-api/commit/ebb15ceec3457709e94ba887ff33c25ad6e82402)]
- 🎨 improve: use @guanghechen/option-helper instead of @barusu/util-option [[ddcca00](https://github.com/guanghechen/static-site-api/commit/ddcca00c87d3159dc4b0caa98ade1007d1374d4f)]
- 🔧 chore: update configs [[b5e7c15](https://github.com/guanghechen/static-site-api/commit/b5e7c155946c6da0cac986e1345c9f163410ab66)]
- 🎨 update eslint configs &amp; lint codes [[235bdca](https://github.com/guanghechen/static-site-api/commit/235bdca564a9dbb0761360d25745fa1d8aaf36c1)]
- 🔧 chore: update rollup configs [[802553e](https://github.com/guanghechen/static-site-api/commit/802553e2f964f996b7f78216d0cc94fb9386e624)]
- 🔧 chore: update jest config [[b5d0c56](https://github.com/guanghechen/static-site-api/commit/b5d0c56f873cc6388779333cd5d86b7c40de394f)]
- 🎨 style: format code with prettier [[7f24a2a](https://github.com/guanghechen/static-site-api/commit/7f24a2ad589894271f8b7e623df93b46c0b04fe7)]
- 🔧 chore: use husky in development environment [[3bf460e](https://github.com/guanghechen/static-site-api/commit/3bf460e3244bde497a65cbb8161b8585c50330a9)]
- ⬆️ chore: upgrade devDependencies [[a059389](https://github.com/guanghechen/static-site-api/commit/a059389d130f5299d109a380ef3f24ac108ad4a7)]
- 🔧 chore: use yarn-deduplicate to deduplicate yarn.lock [[0b1dd5c](https://github.com/guanghechen/static-site-api/commit/0b1dd5cd8109aaec726ec672deb44689398fa8e5)]
- 🔧 chore: update eslint config &amp; lint codes [[3bc040e](https://github.com/guanghechen/static-site-api/commit/3bc040ea0cb3e54e1593d39158e6e65d776794d9)]
- 🎨 style: format codes through &#x27;yarn sort-imports&#x27; [[632af8a](https://github.com/guanghechen/static-site-api/commit/632af8a906d46b81061e25941f31808e093b7799)]
- 🔧 chore: upgrade @barusu/* to v0.0.47 [[3397635](https://github.com/guanghechen/static-site-api/commit/3397635d41593526c6fc442fcd892b997336bc79)]
- 🎨 refactor: rename &#x27;apiUrlRoot&#x27; to &#x27;urlRoot&#x27; [[ca54e79](https://github.com/guanghechen/static-site-api/commit/ca54e799d2847ac088c64c39d31c1cc7b98fb891)]
- 🎨 improve(site-api): provide post-process hook (writing in coroutine) which called after all resource files proceed &amp; update tests [[05ba210](https://github.com/guanghechen/static-site-api/commit/05ba210b8c12887dce25ae28cbda72bfe9febe03)]
- 🎨 refactor(asset-markdown-parser): rename exported funcs [[d51cc54](https://github.com/guanghechen/static-site-api/commit/d51cc54aa0dd69e829e79f2a32303746b667f4c3)]
- 🚚 refactor: rename package @guanghechen/ast-md-props to @guanghechen/asset-markdown-parser [[e341ad6](https://github.com/guanghechen/static-site-api/commit/e341ad6ac07cab93db847416da5e89979dd2483a)]
- 🎨 refactor(ast-md-props): update types [[b760b41](https://github.com/guanghechen/static-site-api/commit/b760b414f8248f0f39ebc4b58e7ed6841a83322a)]
- 🔧 chore: update scripts field (use learn parallel option) [[2c6af28](https://github.com/guanghechen/static-site-api/commit/2c6af28c66c54be889826f49ec067a0663d72b3e)]
- 🔧 chore: export esm modules [[ec0c0b1](https://github.com/guanghechen/static-site-api/commit/ec0c0b11eabb2f9a92ac20adbaa8b5db7e9b8804)]
- 🎨 [ast-md-props] feat: redefine PropsAstCode, support both json and dom-attribute syntax to specify the meta data [[cc62b5c](https://github.com/guanghechen/static-site-api/commit/cc62b5ced3ef9b72c78000bafeecedac96947131)]
- 👽 feat:  update api due to the change of @guanghechen/asset-markdown [[0ca9571](https://github.com/guanghechen/static-site-api/commit/0ca95717d500a0b1dbdde9e4262dde84de3c8323)]
- 🎨 [asset-markdown] feat: remove markdown parser codes, use @guanghechen/ast-md-props instead [[ea21d4f](https://github.com/guanghechen/static-site-api/commit/ea21d4f0ef8a14f10d95a785ec6e0b912ecc1e85)]
- 🎨 refactor: set rawConfig as the first parameter of resolve* funcs [[6fde44d](https://github.com/guanghechen/static-site-api/commit/6fde44d20611c5b49687ff279df531fccad30334)]
- 🎨 [blog-api] improve: use @guanghechen/asset-markdown to optimized codes [[5d624bb](https://github.com/guanghechen/static-site-api/commit/5d624bb8d8efd390fb21496d6410856bf683f37d)]
- 🔧 chore: add jest configs [[d241875](https://github.com/guanghechen/static-site-api/commit/d241875b94dcaad7c27d77161e3d476b239acf51)]
- 🎨 feat: move SourceItem from blog-api to site-api &amp; update util funcs for resolving config [[5db36fe](https://github.com/guanghechen/static-site-api/commit/5db36feadc81e57a3a28fc5c8d5be06650de2adb)]
- 🔧 chore: update path alias [[2201a21](https://github.com/guanghechen/static-site-api/commit/2201a216471fda781d085ccf6c36f20cb969e934)]

### Removed

- 🔥 improve(site-api): never encrypt location [[1cee512](https://github.com/guanghechen/static-site-api/commit/1cee5124c2da8f5b4743fc0cbd4438376b6af535)]
- 🔥 [site-api] refactor: remove useless codes [[def211b](https://github.com/guanghechen/static-site-api/commit/def211bde8ca46fe3804e0ca9ec502614f49b120)]

### Fixed

- 🐛 fix(site-api): throw error if no errorHandler specified in createSerialExecutor [[41f6615](https://github.com/guanghechen/static-site-api/commit/41f6615cb43e0ec8442b5fb8dc8a16510c0174f7)]
- 🐛 fix(site-api): uuids should not reset to undefiend even there is no asset of this type exists [[28e97e1](https://github.com/guanghechen/static-site-api/commit/28e97e13f056d5b73b81b79ebd0dc2235f9eec36)]
- 🐛 fix(asset-markdown-parser/Image): it is &#x60;src&#x60; rather &#x60;url&#x60; for image data node [[4c29c59](https://github.com/guanghechen/static-site-api/commit/4c29c590649f70a44a59b01885766ecaee5191c6)]
- 🐛 fix(blog-api,handbook-api): &#x60;processor.processable&#x60; use glob patterns base on &#x60;source.sourceRoot&#x60; rather than &#x60;source.dataRoot&#x60; [[5531ed8](https://github.com/guanghechen/static-site-api/commit/5531ed8d0bdbcf3f72f71c06569a096ee74f95b9)]
- 🐛 [ast-md-props] fix: add missed property of PropsAstCode &amp; symbol will be lost when convert to json [[50db850](https://github.com/guanghechen/static-site-api/commit/50db8503e030fda02f23c06a6a109f4cfba92bac)]
- 🐛 [site-api] fix: fix missing the new parent node when the current node already exists [[bebc7eb](https://github.com/guanghechen/static-site-api/commit/bebc7eb85fb4e746f969206596aa1e887d2b474e)]

### Miscellaneous

- 🚧 feat(asset-markdown-parser): use types from @yozora/ instead of mdast &amp; update resolveMdDocument [[e13244a](https://github.com/guanghechen/static-site-api/commit/e13244ae4df2a02ecf36adbcb57c0c7debf15bf4)]
- 📝 dcos: update README [[d65dade](https://github.com/guanghechen/static-site-api/commit/d65daded4316da48ef04bc1a722c1de2a6fb9f1c)]
- 📄 docs: update LICENCE [[3f837cd](https://github.com/guanghechen/static-site-api/commit/3f837cddc3c4ef4b8f59c7c10d3ecc628541c780)]
- 🚧 [asset-markdown-parser] improve: use @yozora/parser-gfm instead of remark [[6de2d7c](https://github.com/guanghechen/static-site-api/commit/6de2d7ca4d39aad17f6706f8eb0054e78c3d19f3)]
- 🚧 improve: update types [[8341ac2](https://github.com/guanghechen/static-site-api/commit/8341ac2e71fbaf34a9ce98a140edb8ec9b775b66)]
- 🚧 improve(asset-markdown-parser): update types [[47f5089](https://github.com/guanghechen/static-site-api/commit/47f508930fcf882a485aaf6301379489b656935a)]
- 🚧 feat(asset-markdown-parser): support toc [[774579b](https://github.com/guanghechen/static-site-api/commit/774579bb0aec2a039034566be74538fb2579cb3e)]
- 🚧 feat(asset-markdown-parser): export util func for creating empty MdastPropsRoot [[0bf6258](https://github.com/guanghechen/static-site-api/commit/0bf6258393c36e30f67f02b0d8fce895a308a490)]
- 🚧 feat(asset-markdown-parser): resolve toc data &amp; append into meta [[5351991](https://github.com/guanghechen/static-site-api/commit/53519917041f8822c76a49c9c838df228d8277e1)]
- 🚧 improve: convert ISOString directly with dayjs [[31d7886](https://github.com/guanghechen/static-site-api/commit/31d7886bebaf61aa8ff8eaeccacf2757a92d4e19)]
- 🚧 improve(handbook-api,blog-api): no longer re-export from @guanghechen/site-api [[1e5f481](https://github.com/guanghechen/static-site-api/commit/1e5f48135d750ee9ec867b365b8a97f5a94df5bd)]
- 🚧 improve(blog-api, handbook-api): support image, file assets [[a550640](https://github.com/guanghechen/static-site-api/commit/a550640b9594348f664a1c420dea13bc8fbe51c1)]
- 🚧 improve(site-api): use subSiteConfig.source.$.dataRoot to locate the source data filepath [[f701fb5](https://github.com/guanghechen/static-site-api/commit/f701fb5906a02e8f8781c65260d941d1cbbae1a2)]
- 🚧 improve(site-api): update SubSiteConfigResolver signature &amp; fix missing params on the process.process().next()&#x27;s second called [[d0a169f](https://github.com/guanghechen/static-site-api/commit/d0a169fdb24f1b262d973bf22c1512670ba16ce3)]
- 🚧 improve: use route: prefix to refer to a route pathname rather than a real api path [[2c66877](https://github.com/guanghechen/static-site-api/commit/2c66877a93c5cda4613f4876e729845bba170acb)]
- 🚧 improve: use apiUrlRoot and routeRoot instead of urlRoot [[416c7ab](https://github.com/guanghechen/static-site-api/commit/416c7ab7bb2b196cf8838403b8beebedef27457d)]
- 🚧 improve(handbook-api,blog-api): updating resolveUrl logic [[ee287a0](https://github.com/guanghechen/static-site-api/commit/ee287a0bc99b1009c9bba443553df5633eb7dbae)]
- 🚧 improve(site-api): AssetEntity add member &#x27;extname&#x27; [[c22a331](https://github.com/guanghechen/static-site-api/commit/c22a3315eb3b994019002e5268d8e381ea9f73e5)]
- 🚧 improve(asset-markdown-parser): support hook for resolving url path [[50462b5](https://github.com/guanghechen/static-site-api/commit/50462b5b2b113636fd19c5fcfd0a873133043a9f)]
- 🚧 improve(handbook-api): build menu tree before EntryDataMap dumping [[690fd72](https://github.com/guanghechen/static-site-api/commit/690fd72de749a0179cc2d90f34e73a9124771e26)]
- 🚧 improve(site-api): update AssetDataProvider constructor params [[28c2165](https://github.com/guanghechen/static-site-api/commit/28c21651a24d008ded7e93857ad0cd53c70b2c37)]
- 🚧 improve(site-api): generate entry data map [[1bc7fa4](https://github.com/guanghechen/static-site-api/commit/1bc7fa4cc5bdccfbc1fdb1875f4f552ec393106e)]
- 🚧 feat(handbook-api): add EntryService [[72b48fc](https://github.com/guanghechen/static-site-api/commit/72b48fc7d6b17ff971307f9ef6e99b8387a31e52)]
- 🚧 improve(site-api): asset types need to register at the begining [[00d22cb](https://github.com/guanghechen/static-site-api/commit/00d22cb41cf79478cde0261b291c2497b1d7ad9e)]
- 🚧 improve(site-api): generate unique id from text for tag and category &amp; update tests [[34b6152](https://github.com/guanghechen/static-site-api/commit/34b615203a3fe036fb3586c9bd5e1d6c37fad06a)]
- 🚧 feat: update PropsAstTable [[315000e](https://github.com/guanghechen/static-site-api/commit/315000e7baca01176bec699abcec111f9792fb3a)]
- 🚧 feat: merge ulist and olist to list [[652488b](https://github.com/guanghechen/static-site-api/commit/652488b4fbde6bc1151939846f10cf77c8153bd2)]
- 🚧 feat: split list to ulist and olist [[3bc6d91](https://github.com/guanghechen/static-site-api/commit/3bc6d91179367b5f9c87156a2a95cb1623ccd032)]
- 🚧 feat: add sub package @guanghechen/ast-md-props [[dfc8857](https://github.com/guanghechen/static-site-api/commit/dfc885765cfbe8f4da336fff76f13ad6695fb36e)]
- 🚧 feat: parse markdown to ast data [[0dbb39b](https://github.com/guanghechen/static-site-api/commit/0dbb39b3e5f3bb1e27f79882d478630b5ee2182c)]
- 🚧 [asset-markdown] feat: support specify custom parse [[9b4661b](https://github.com/guanghechen/static-site-api/commit/9b4661b7df63a590d03beb554c1684aa6ce2dd93)]
- 🚧 feat: AssetService export &#x27;locate&#x27; func [[9abc464](https://github.com/guanghechen/static-site-api/commit/9abc464c27372e8871f0b86839f7d0e4576098b2)]
- 🚧 [asset-markdown] feat: support for making &#x27;meta&#x27; optional [[6eb9e18](https://github.com/guanghechen/static-site-api/commit/6eb9e18f2e22436cf7d09eec0442f37a9c345812)]
- 📝 [handbook-api] doc: add README [[bafe2ac](https://github.com/guanghechen/static-site-api/commit/bafe2ac813248acf19dc202782a3f44c12ff49c4)]
- 🚧 feat: add new sub package &#x27;@guanghechen/handbook-api&#x27; [[e4c9292](https://github.com/guanghechen/static-site-api/commit/e4c9292a06fabd656d244a2091ae15cefb7e3ad2)]
- 🚧 feat: add new package @guanghechen/asset-markdown [[c9ffe02](https://github.com/guanghechen/static-site-api/commit/c9ffe0267778fa9435985e7ee9e8d1038f00700e)]
- 🚧 [site-api] feat: add uuid in RoughAssetDataItem [[e7aa8e3](https://github.com/guanghechen/static-site-api/commit/e7aa8e32d905ecf656953b952b11848d3794c71a)]
- 🚧 feat: expose service directly in Provider [[90f6450](https://github.com/guanghechen/static-site-api/commit/90f645090e050fc2780373c746a32a994d731938)]
- 🚧 feat: add @guanghechen/blog-api [[2112d3c](https://github.com/guanghechen/static-site-api/commit/2112d3c01462fd10e0174dffcaa084f68e7fbe3b)]
- 🚧 feat: add @guanghechen/site-api [[d7a08ad](https://github.com/guanghechen/static-site-api/commit/d7a08ad6758865167c29f9228f506504000e05ed)]
