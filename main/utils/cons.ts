const cons = {
  s: (m: string) => {
    console.log(`%c[SUCCESS]%c ${m}`, "color:white;background:green;", "");
  },
  w: (m: string) => {
    console.log(`%c[WARNING]%c ${m}`, "color:brown;background:yellow;", "");
  },
  i: (m: string) => {
    console.log(`%c[INFO]%c ${m}`, "color:white;background:blue;", "");
  },
  e: (m: string) => {
    console.log(`%c[ERROR]%c ${m}`, "color:white;background:red;", "");
  },
  d: (m: string) => {
    console.log(`%c[DEBUG]%c ${m}`, "color:white;background:black;", "");
  },
};
export default cons;
