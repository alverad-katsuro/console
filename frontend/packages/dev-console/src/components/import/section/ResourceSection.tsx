import * as React from 'react';
import { SelectVariant } from '@patternfly/react-core';
import { FormikValues, useField, useFormikContext } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { getActiveNamespace } from '@console/internal/actions/ui';
import { useAccessReview } from '@console/internal/components/utils';
import { DeploymentModel, DeploymentConfigModel } from '@console/internal/models';
import { connectToFlags } from '@console/internal/reducers/connectToFlags';
import { FlagsObject } from '@console/internal/reducers/features';
import { FLAG_KNATIVE_SERVING_SERVICE, ServiceModel } from '@console/knative-plugin';
import { SelectInputField, SelectInputOption } from '@console/shared';
import { Resources, ReadableResourcesNames } from '../import-types';
import FormSection from './FormSection';
import { useResourceType } from './useResourceType';
import './ResourceSection.scss';

type ResourceSectionProps = {
  flags: FlagsObject;
};

const ResourceSection: React.FC<ResourceSectionProps> = ({ flags }) => {
  const { t } = useTranslation();
  const [field] = useField<Resources[]>('resourceTypesNotValid');
  const fieldName = 'resources';
  const { setFieldValue } = useFormikContext<FormikValues>();
  const invalidTypes = field.value || [];

  const knativeServiceAccess = useAccessReview({
    group: ServiceModel.apiGroup,
    resource: ServiceModel.plural,
    namespace: getActiveNamespace(),
    verb: 'create',
  });
  const canIncludeKnative =
    !invalidTypes.includes(Resources.KnativeService) &&
    flags[FLAG_KNATIVE_SERVING_SERVICE] &&
    knativeServiceAccess;

  const [resourceType, setResourceType] = useResourceType();

  React.useEffect(() => {
    setFieldValue(fieldName, resourceType);
  }, [resourceType, setFieldValue]);

  const onChange = React.useCallback(
    (selection: string) => {
      const value = _.findKey(ReadableResourcesNames, (name) => t(name) === selection);
      setResourceType(value);
      setFieldValue(fieldName, value);
    },
    [setFieldValue, setResourceType, t],
  );

  const selectInputOptions = React.useMemo(() => {
    const options: SelectInputOption[] = [];
    if (!invalidTypes.includes(Resources.Kubernetes)) {
      options.push({
        label: t(ReadableResourcesNames[Resources.Kubernetes]),
        value: Resources.Kubernetes,
        description: t(
          'devconsole~A {{deploymentLabel}} enables declarative updates for Pods and ReplicaSets.',
          { deploymentLabel: DeploymentModel.label },
        ),
      });
    }
    if (!invalidTypes.includes(Resources.OpenShift)) {
      options.push({
        label: t(ReadableResourcesNames[Resources.OpenShift]),
        value: Resources.OpenShift,
        description: t(
          'devconsole~A {{deploymentConfigLabel}} defines the template for a Pod and manages deploying new Images or configuration changes.',
          { deploymentConfigLabel: DeploymentConfigModel.label },
        ),
      });
    }

    if (canIncludeKnative) {
      options.push({
        label: t(ReadableResourcesNames[Resources.KnativeService]),
        value: Resources.KnativeService,
        description: t(
          'devconsole~A type of deployment that enables Serverless scaling to 0 when idle.',
        ),
      });
    }
    return options;
  }, [invalidTypes, canIncludeKnative, t]);

  return (
    <FormSection title={t('devconsole~Resources')} fullWidth>
      <div>{t('devconsole~Select the resource type to generate')}</div>
      <SelectInputField
        name={fieldName}
        options={selectInputOptions}
        variant={SelectVariant.single}
        onChange={onChange}
        getLabelFromValue={(value: string) => t(ReadableResourcesNames[value])}
        toggleOnSelection
      />
    </FormSection>
  );
};

export default connectToFlags(FLAG_KNATIVE_SERVING_SERVICE)(ResourceSection);
