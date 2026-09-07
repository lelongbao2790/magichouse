import nextConfig from "eslint-config-next";

const config = [
  { ignores: ["coverage/**"] },
  ...nextConfig,
  {
    rules: {
      // New strict React 19 rules — downgrade to warn until existing code is migrated
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/immutability": "warn",
    },
  },
];

export default config;
