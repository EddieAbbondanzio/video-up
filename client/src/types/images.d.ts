// Parcel automatically works with files such as images, or css but TypeScript
// complains will complain about them saying the module is missing types unless
// we declare them.
// Src: https://stackoverflow.com/a/63885623

declare module "*.jpg";
declare module "*.png";
