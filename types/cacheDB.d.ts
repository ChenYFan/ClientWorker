// Type definitions for @chenyfan/cache-db 0.0
// Project: https://www.npmjs.com/package/@chenyfan/cache-db
// Definitions by: AHdark <https://github.com/AH-dark>
//                 lixiang810 <https://github.com/lixiang810>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

declare module "@chenyfan/cache-db" {
  namespace CacheDB {
    interface Config {
      type: "json" | "arrayBuffer" | "blob" | "text" | string;
    }
    type ReadMethodData = object | ArrayBuffer | Blob | string | null;
    type WriteValue =
      | ReadableStream
      | Blob
      | ArrayBufferView
      | ArrayBuffer
      | FormData
      | URLSearchParams
      | string;
  }

  class CacheDB {
    constructor(namespace?: string, prefix?: string);

    namespace: string;
    prefix: string;

    read<T = CacheDB.ReadMethodData>(
      key: string,
      config?: CacheDB.Config
    ): Promise<T>;
    write(
      key: string | number | boolean,
      value: CacheDB.WriteValue,
      config?: CacheDB.Config
    ): Promise<boolean>;
    delete(key: string): Promise<boolean>;
  }

  export default CacheDB;
}
