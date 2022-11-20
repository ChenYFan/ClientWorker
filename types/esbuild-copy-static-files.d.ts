declare module "esbuild-copy-static-files" {
  export default function copyStaticFiles(param: {
    src: string;
    dest: string;
    dereference?: boolean;
    errorOnExist?: boolean;
    filter?: (...param: any) => boolean;
    force?: boolean;
    preserveTimestamps?: boolean;
    recursive?: boolean;
  }): import("esbuild").Plugin;
}
