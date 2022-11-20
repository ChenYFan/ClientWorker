import cons from "./cons.js";

const rebuild = {
  request: (req: Request, init: Partial<RequestInit & { url: string }>) => {
    req = req.clone();
    if (req.mode === "navigate") {
      cons.w(
        `You can't rebuild a POST method with body when it is a navigate request.ClientWorker will ignore it's body`
      );
    }
    let nReq = new Request(req, {
      headers: rebuildheaders(req, init.headers),
      method: init.method || req.method,
      mode: req.mode === "navigate" ? "same-origin" : init.mode || req.mode,
      credentials: init.credentials || req.credentials,
      redirect: init.redirect || req.redirect,
    });
    if (!!init.url) nReq = new Request(init.url, nReq);
    return nReq;
  },
  response: (res: Response, init: Partial<ResponseInit & { body: string }>) => {
    if (res.type === "opaque") {
      cons.e(
        `You can't rebuild a opaque response.ClientWorker will ignore this build`
      );
      return res;
    }
    let nRes = new Response(res.body, {
      headers: rebuildheaders(res, init.headers),
      status: init.status || res.status,
      statusText: init.statusText || res.statusText,
    });
    return nRes;
  },
};

const rebuildheaders = (
  re: Request | Response,
  headers: HeadersInit | undefined
) => {
  if (!!headers) {
    const nHeaders = new Headers(re.headers);
    Object.entries(headers).forEach(([key, value]) => {
      if (!value) {
        nHeaders.delete(key);
      } else nHeaders.set(key, value);
    });
    return nHeaders;
  }
  return new Headers(re.headers);
};

export default rebuild;
