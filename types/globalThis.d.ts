declare global {
  var clientworkerhandle: (req: Request) => Response | PromiseLike<Response>;
  var clients: { claim(): Promise<void> };
  var skipWaiting: () => Promise<void> | void;
}

export {};
