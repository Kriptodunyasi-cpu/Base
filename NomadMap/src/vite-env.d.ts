/// <reference types="vite/client" />

interface Window {
  ethereum?: any;
}

declare module "*.png" {
  const value: string;
  export default value;
}
