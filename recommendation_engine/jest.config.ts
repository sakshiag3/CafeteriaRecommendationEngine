module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    transform: {
      "^.+\\.(ts|tsx)$": [
        "ts-jest",
        {
          tsconfig: "tsconfig.json",
          diagnostics: false, 
        },
      ],
    },
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  };