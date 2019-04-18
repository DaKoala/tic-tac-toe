module.exports = {
    env: {
        'browser': true,
        'node': true,
    },
    "extends": ["airbnb-base", "plugin:@typescript-eslint/recommended"],
    parser: "@typescript-eslint/parser",
    plugins: [
        '@typescript-eslint',
    ],
    rules: {
        'no-console': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/no-unused-vars': 'error',
    }
};
