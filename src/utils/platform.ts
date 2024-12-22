export const isMacOS = () => {
  return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
};