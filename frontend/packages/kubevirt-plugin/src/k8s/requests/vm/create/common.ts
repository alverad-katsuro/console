import { TemplateKind } from '@console/internal/module/k8s';
import { getName, getNamespace, getAnnotations } from '@console/shared/src';
import { VMSettingsField } from '../../../../components/create-vm-wizard/types';
import {
  ANNOTATION_DESCRIPTION,
  APP,
  ANNOTATION_VALIDATIONS,
  LABEL_USED_TEMPLATE_NAME,
  LABEL_USED_TEMPLATE_NAMESPACE,
  TEMPLATE_FLAVOR_LABEL,
  TEMPLATE_OS_LABEL,
  TEMPLATE_OS_NAME_ANNOTATION,
  TEMPLATE_VM_DOMAIN_LABEL,
  TEMPLATE_VM_NAME_LABEL,
  TEMPLATE_WORKLOAD_LABEL,
  TEMPLATE_TYPE_LABEL,
  TEMPLATE_TYPE_VM,
  ANNOTATION_ICON,
  TEMPLATE_PROVIDER_ANNOTATION,
  TEMPLATE_SUPPORT_LEVEL,
  TEMPLATE_PARENT_PROVIDER_ANNOTATION,
  TEMPLATE_PARENT_SUPPORT_LEVEL,
  TEMPLATE_PARENT_PROVIDER_URL,
  TEMPLATE_PROVIDER_URL,
} from '../../../../constants/vm';
import { VMWrapper } from '../../../wrapper/vm/vm-wrapper';
import { VMTemplateWrapper } from '../../../wrapper/vm/vm-template-wrapper';
import { isCustomFlavor } from '../../../../selectors/vm-like/flavor';
import { isCommonTemplate } from '../../../../selectors/vm-template/basic';
import { TemplateSupport } from '../../../../constants/vm-templates/support';

export const initializeCommonMetadata = (
  settings: {
    [VMSettingsField.DESCRIPTION]: string;
    [VMSettingsField.FLAVOR]: string;
    [VMSettingsField.WORKLOAD_PROFILE]: string;
    [VMSettingsField.TEMPLATE_PROVIDER]: string;
    [VMSettingsField.TEMPLATE_SUPPORTED]: string;
    osID: string;
    osName: string;
  },
  entity: VMWrapper | VMTemplateWrapper,
  template?: TemplateKind,
) => {
  entity.addAnotation(`${TEMPLATE_OS_NAME_ANNOTATION}/${settings.osID}`, settings.osName);

  if (settings[VMSettingsField.DESCRIPTION]) {
    entity.addAnotation(ANNOTATION_DESCRIPTION, settings[VMSettingsField.DESCRIPTION]);
  }

  entity.addLabel(`${TEMPLATE_OS_LABEL}/${settings.osID}`, 'true');

  if (!isCustomFlavor(settings[VMSettingsField.FLAVOR])) {
    entity.addLabel(`${TEMPLATE_FLAVOR_LABEL}/${settings[VMSettingsField.FLAVOR]}`, 'true');
  }

  if (settings[VMSettingsField.WORKLOAD_PROFILE]) {
    entity.addLabel(
      `${TEMPLATE_WORKLOAD_LABEL}/${settings[VMSettingsField.WORKLOAD_PROFILE]}`,
      'true',
    );
  }

  if (template) {
    entity.addLabel(LABEL_USED_TEMPLATE_NAME, getName(template));
    entity.addLabel(LABEL_USED_TEMPLATE_NAMESPACE, getNamespace(template));
  }

  return entity;
};

export const initializeCommonVMMetadata = (
  settings: {
    [VMSettingsField.NAME]: string;
    [VMSettingsField.FLAVOR]: string;
    [VMSettingsField.WORKLOAD_PROFILE]: string;
    osID: string;
  },
  entity: VMWrapper,
) => {
  const name = settings[VMSettingsField.NAME];

  entity.addTemplateLabel(TEMPLATE_VM_NAME_LABEL, name); // for pairing service-vm (like for RDP)

  if (!entity.hasTemplateLabel(TEMPLATE_VM_DOMAIN_LABEL)) {
    entity.addTemplateLabel(TEMPLATE_VM_DOMAIN_LABEL, name);
  }

  if (!entity.hasLabel(APP)) {
    entity.addLabel(APP, name);
  }

  // show metadata inside a VMI

  entity.addTemplateLabel(`${TEMPLATE_OS_LABEL}/${settings.osID}`, 'true');

  if (!isCustomFlavor(settings[VMSettingsField.FLAVOR])) {
    entity.addTemplateLabel(`${TEMPLATE_FLAVOR_LABEL}/${settings[VMSettingsField.FLAVOR]}`, 'true');
  }

  if (settings[VMSettingsField.WORKLOAD_PROFILE]) {
    entity.addTemplateLabel(
      `${TEMPLATE_WORKLOAD_LABEL}/${settings[VMSettingsField.WORKLOAD_PROFILE]}`,
      'true',
    );
  }
};

export const initializeCommonTemplateMetadata = (
  settings: {
    [VMSettingsField.DESCRIPTION]: string;
    [VMSettingsField.FLAVOR]: string;
    [VMSettingsField.WORKLOAD_PROFILE]: string;
    [VMSettingsField.TEMPLATE_PROVIDER]: string;
    [VMSettingsField.TEMPLATE_SUPPORTED]: string;
    osID: string;
    osName: string;
  },
  entity: VMTemplateWrapper,
  template?: TemplateKind,
) => {
  const annotations = getAnnotations(template);

  const validations = annotations?.[ANNOTATION_VALIDATIONS];

  entity.addLabel(TEMPLATE_TYPE_LABEL, TEMPLATE_TYPE_VM);
  validations && entity.addAnotation(ANNOTATION_VALIDATIONS, validations);

  const iconClass = annotations?.[ANNOTATION_ICON];
  iconClass && entity.addAnotation(ANNOTATION_ICON, iconClass);

  let provider = annotations?.[TEMPLATE_PROVIDER_ANNOTATION];
  let supportLevel = annotations?.[TEMPLATE_SUPPORT_LEVEL];

  const isUpstream = window.SERVER_FLAGS.branding === 'okd';
  if (
    !provider &&
    !supportLevel &&
    !isUpstream &&
    isCommonTemplate(template) &&
    (template.metadata.name.startsWith('win') || template.metadata.name.startsWith('rhel'))
  ) {
    provider = 'Red Hat';
    supportLevel = 'Full';
  }
  if (provider && supportLevel) {
    entity.addAnotation(TEMPLATE_PARENT_SUPPORT_LEVEL, supportLevel);
    entity.addAnotation(TEMPLATE_PARENT_PROVIDER_ANNOTATION, provider);
    const providerURL = annotations?.[TEMPLATE_PROVIDER_URL];
    if (providerURL) {
      entity.addAnotation(TEMPLATE_PARENT_PROVIDER_URL, providerURL);
    }
  }

  if (settings[VMSettingsField.TEMPLATE_PROVIDER]) {
    entity.addAnotation(TEMPLATE_PROVIDER_ANNOTATION, settings[VMSettingsField.TEMPLATE_PROVIDER]);
  }
  if (
    TemplateSupport.fromString(settings[VMSettingsField.TEMPLATE_SUPPORTED]) ===
    TemplateSupport.FULL_SUPPORT
  ) {
    entity.addAnotation(TEMPLATE_SUPPORT_LEVEL, TemplateSupport.FULL_SUPPORT.getValue());
  }
};
