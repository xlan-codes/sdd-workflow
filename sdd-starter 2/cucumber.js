/** BDD runner config — executes the SAME .feature files that live with the spec. */
module.exports = {
  default: {
    requireModule: ['ts-node/register'],
    require: ['features/steps/**/*.ts'],
    paths: ['specs/checkout-refunds/contracts/**/*.feature'],
    format: ['progress'],
    publishQuiet: true,
  },
};
