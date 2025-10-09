const useRouter = () => ({ push: () => {}, replace: () => {}, back: () => {} });
const Link = ({ children, href, asChild }) => children;
module.exports = { useRouter, Link };