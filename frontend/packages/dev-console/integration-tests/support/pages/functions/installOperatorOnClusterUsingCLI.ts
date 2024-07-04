import { operatorNamespaces, operatorSubscriptions, operators } from '../../constants/global';
import { checkPipelineOperatorStatus, checkKnativeOperatorStatus } from './checkOperatorStatus';
import {
  createKnativeEventingUsingCLI,
  createKnativeKafkaUsingCLI,
  createKnativeServingUsingCLI,
} from './knativeSubscriptions';

export const performPostInstallationSteps = (operator: operators): void => {
  switch (operator) {
    case operators.PipelinesOperator:
      cy.log(`Performing Pipelines post-installation steps`);
      checkPipelineOperatorStatus();
      break;
    case operators.ServerlessOperator:
      cy.log(`Performing Serverless post-installation steps`);
      cy.wait(40000);
      createKnativeServingUsingCLI();
      createKnativeEventingUsingCLI();
      createKnativeKafkaUsingCLI();
      break;
    default:
      cy.log(`Nothing to do in post-installation steps`);
  }
};

export const checkOperatorStatus = (operator: operators) => {
  switch (operator) {
    case operators.PipelinesOperator:
      checkPipelineOperatorStatus();
      break;
    case operators.ServerlessOperator:
      checkKnativeOperatorStatus();
      break;
    default:
      throw new Error('Invalid Operator');
  }
};

export const installOperatorUsingCLI = (operator: operators) => {
  let yamlFile;
  switch (operator) {
    case operators.PipelinesOperator:
      yamlFile =
        '../../pipelines-plugin/integration-tests/testData/pipelinesOperatorSubscription.yaml';
      break;
    case operators.ServerlessOperator:
      yamlFile =
        '../../knative-plugin/integration-tests/testData/serverlessOperatorSubscription.yaml';
      break;
    default:
      throw new Error('Invalid Operator');
  }

  cy.exec(`oc apply -f ${yamlFile}`, {
    failOnNonZeroExit: false,
  }).then(function (result) {
    if (result.stderr) {
      throw new Error(result.stderr);
    } else {
      cy.log(result.stdout);
    }
  });

  performPostInstallationSteps(operator);
};

export const checkSubscriptionStatus = (operator: operators) => {
  let namespace;
  let subscriptionName;
  const resourceName = 'subscriptions.operators.coreos.com';
  const condition = 'CatalogSourcesUnhealthy=false';

  switch (operator) {
    case operators.PipelinesOperator:
      namespace = operatorNamespaces.PipelinesOperator;
      subscriptionName = operatorSubscriptions.PipelinesOperator;
      break;
    case operators.ServerlessOperator:
      namespace = operatorNamespaces.ServerlessOperator;
      subscriptionName = operatorSubscriptions.ServerlessOperator;
      break;
    default:
      throw new Error('Invalid Operator');
  }

  cy.exec(
    `oc wait ${resourceName} --for=condition=${condition} --timeout=10m -n ${namespace} ${subscriptionName}`,
    {
      failOnNonZeroExit: false,
    },
  ).then(function (result) {
    if (result.stdout.includes('condition met')) {
      cy.log(`${operator} is installed in cluster, check operator status.`);
      checkOperatorStatus(operator);
    } else {
      cy.log(`${operator} not installed, installing...`);
      installOperatorUsingCLI(operator);
    }
  });
};

export const verifyAndInstallOperatorUsingCLI = (operator: operators) => {
  checkSubscriptionStatus(operator);
};

export const installPipelinesOperatorUsingCLI = () => {
  verifyAndInstallOperatorUsingCLI(operators.PipelinesOperator);
};

export const installKnativeOperatorUsingCLI = () => {
  verifyAndInstallOperatorUsingCLI(operators.ServerlessOperator);
};
