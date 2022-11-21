import CacheDB from "@chenyfan/cache-db";
import pkgjson from "../package.json";
import clientworkerhandle from "./handle/main";
import cons from "./utils/cons";

// For compatibility

self.clientworkerhandle = clientworkerhandle;

cons.s(`ClientWorker${pkgjson.version} Started!`);
const db = new CacheDB();
db.read("hotpatch").then((script) => {
  if (!!script) {
    cons.s("Hotpatch Loaded!");
    eval(script as string);
  } else {
    cons.w("Hotpatch Not Found!");
  }
});

db.read<string>("config").then((config) => {
  const cfg = JSON.parse(config) || {};
  config = cfg;
  setInterval(() => {
    cons.s(`ClientWorker@${pkgjson.version} Start to Clean Expired Cache!`);
    caches.open("ClientWorker_ResponseCache").then((cache) => {
      cache.keys().then((keys) => {
        keys.forEach((key) => {
          cache.match(key).then((res) => {
            if (
              Number(res!.headers.get("ClientWorker_ExpireTime")) <=
              new Date().getTime()
            ) {
              cache.delete(key);
            }
          });
        });
      });
    });
  }, eval(cfg.cleaninterval) || 60 * 1000);
});
addEventListener("fetch", (event) => {
  (event as FetchEvent).respondWith(
    self.clientworkerhandle((event as FetchEvent).request)
  );
});
addEventListener("install", function () {
  cons.s(`ClientWorker@${pkgjson.version} Installed!`);
  self.skipWaiting();
});
addEventListener("activate", function () {
  cons.s(`ClientWorker@${pkgjson.version} Activated!`);
  self.clients.claim();
});
