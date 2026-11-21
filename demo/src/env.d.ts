/// <reference types="vite/client" />
declare module "@skolo-saka/school-search/styles.css";

interface ImportMetaEnv {
  /** Website and API origin for live search. Default https://www.skolosaka.co.za. */
  readonly VITE_SKOLO_SAKA_ORIGIN?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
