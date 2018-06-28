// Copyright (c) Microsoft. All rights reserved.

import React from 'react';

import {
  AjaxError,
  Btn,
  BtnToolbar,
  FormControl,
  FormGroup,
  FormLabel,
  PillFormControl,
  Indicator,
  Radio,
  SectionDesc,
  SectionHeader,
  SummaryBody,
  SummaryCount,
  SummarySection,
  Svg,
  ToggleBtn
} from 'components/shared';
import { SeverityRenderer } from 'components/shared/cellRenderers';
import {
  Validator,
  svgs,
  LinkedComponent
} from 'utilities';
import Flyout from 'components/shared/flyout';
import { IoTHubManagerService, TelemetryService } from 'services';
import { toNewRuleRequestModel } from 'services/models';
import Config from 'app.config';
import update from 'immutability-helper';

import './ruleEditor.css';

const Section = Flyout.Section;
const calculations = ['Average', 'Instant'];
// Represented in milliSeconds
const timePeriodOptions = [
  { label: '1', value: '60000' },
  { label: '5', value: '300000' },
  { label: '10', value: '600000' }
];
const operatorOptions = [
  { label: '>', value: 'GreaterThan' },
  { label: '>=', value: 'GreaterThanOrEqual' },
  { label: '<', value: 'LessThan' },
  { label: '<=', value: 'LessThanOrEqual' },
  { label: '=', value: 'Equals' }
];

// A counter for creating unique keys per new condition
let conditionKey = 0;

// A counter for creating unique keys per new action
let actionKey = 0;

// Creates a state object for a condition
const newCondition = () => ({
  field: '',
  operator: operatorOptions[0].value,
  value: '',
  key: conditionKey++ // Used by react to track the rendered elements
});

const newAction = () => ({
  type: "Email",
  parameters: {
    email: [],
    template: ''
  },
  key: actionKey++
})

// A state object for a new rule
const newRule = {
  name: '',
  description: '',
  groupId: '',
  calculation: '',
  timePeriod: '',
  conditions: [newCondition()], // Start with one condition
  actions: [newAction()], // Start with one action
  severity: Config.ruleSeverity.critical,
  enabled: true,
  actionEnabled: false
}

export class RuleEditor extends LinkedComponent {

  constructor(props) {
    super(props);

    this.state = {
      error: undefined,
      fieldOptions: [],
      fieldQueryPending: true,
      devicesAffected: 0,
      formData: newRule,
      newEmail: '',
      isPending: false,
      changesApplied: undefined
    };

    this.formDataLink = this.linkTo('formData');
    this.newEmailLink = this.linkTo('newEmail') // Matches email address pattern
      .check(val => val.match(/^$|^(([^<>()\]\\.,;:\s@"]+(\.[^<>()\]\\.,;:\s@"]+)*)|(".+"))@(([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/), props.t('rules.flyouts.ruleEditor.actions.syntaxError'));
  }

  componentDidMount() {
    const { rule } = this.props;
    if (rule) {
      this.getDeviceCountAndFields(rule.groupId);
      this.setFormState(rule);
    }
  }

  componentWillReceiveProps(nextProps) {
    const { rule } = nextProps;
    if (rule) this.setFormState(rule);
  }

  setFormState = (rule) => this.setState({
    formData: {
      ...rule,
      conditions: (rule.conditions || []).map(condition => ({
        ...condition,
        key: conditionKey++
      })),
      actions: (rule.actions.length === 0 ? [newAction()] : rule.actions).map(action => ({
        ...action,
        key: actionKey++
      })),
      actionEnabled: (rule.actions || []).length > 0 ? true : false
    }
  });

  componentWillUnmount() {
    if (this.subscription) this.subscription.unsubscribe();
  }

  toSelectOption = ({ id, displayName }) => ({ label: displayName, value: id });

  addCondition = () => this.conditionsLink.set([...this.conditionsLink.value, newCondition()]);

  addAction = () => this.actionsLink.set([...this.actionsLink.value, newAction()]);

  deleteCondition = (index) =>
    (evt) => this.conditionsLink.set(this.conditionsLink.value.filter((_, idx) => index !== idx));

  deleteAction = (index) =>
    (evt) => this.actionsLink.set(this.actionsLink.value.filter((_, idx) => index !== idx));

  formIsValid() {
    return [
      this.ruleNameLink,
      this.deviceGroupLink,
      this.conditionsLink,
      this.actionsLink,
      this.timePeriodLink,
      this.calculationLink
    ].every(link => !link.error);
  }

  apply = (event) => {
    event.preventDefault();
    const { insertRules, modifyRules } = this.props;
    const requestProps = { ...this.state.formData };
    const { devicesAffected } = this.state;
    if (requestProps.calculation === calculations[1]) requestProps.timePeriod = '';
    if (this.state.formData.actionEnabled === false) requestProps.actions = [];
    if (this.formIsValid()) {
      this.setState({ isPending: true, error: null });
      if (this.subscription) this.subscription.unsubscribe();
      const countProps = {
        count: {
          response: devicesAffected,
          error: undefined
        },
        lastTrigger: {
          response: undefined,
          erroe: undefined
        }
      };
      if (this.props.rule) { // If rule object exist then update the existing rule
        this.subscription = TelemetryService.updateRule(this.props.rule.id, toNewRuleRequestModel(requestProps))
          .subscribe(
            (updatedRule) => {
              modifyRules([{ ...updatedRule, ...countProps }]);
              this.setState({ isPending: false, changesApplied: true });
            },
            error => this.setState({ error, isPending: false, changesApplied: true })
          );
      } else { // If rule object doesn't exist then create a new rule
        this.subscription = TelemetryService.createRule(toNewRuleRequestModel(requestProps))
          .subscribe(
            (createdRule) => {
              insertRules([{ ...createdRule, ...countProps }]);
              this.setState({ isPending: false, changesApplied: true });
            },
            error => this.setState({ error, isPending: false, changesApplied: true })
          );
      }
    }
  }

  onGroupIdChange = ({ target: { value: { value = {} } } }) => {
    this.setState({
      fieldQueryPending: true,
      isPending: true
    });
    this.getDeviceCountAndFields(value);
    this.formControlChange();
  }

  onAddEmail = (link) => (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!this.newEmailLink.error && this.newEmailLink.value !== "") {
        const newState = update(
          this.state,
          {
            // Saves user entered email value into action object's list of emails
            ...link.setter({ $set: [...link.value, this.newEmailLink.value] }),
            // Clears new email input textfield of user's entered email value
            ...this.newEmailLink.setter({ $set: '' })
          }
        );
        this.setState(newState);
      }
    }
  }

  deleteEmail = (index) => (link) =>
    (e) => link.set(link.value.filter((_, idx) => index !== idx));

  getDeviceCountAndFields(groupId) {
    this.props.deviceGroups.some(group => {
      if (group.id === groupId) {
        if (this.subscription) this.subscription.unsubscribe();
        this.subscription = IoTHubManagerService.getDevices(group.conditions)
          .subscribe(
            groupDevices => {
              this.setState({
                fieldQueryPending: false,
                fieldOptions: this.getConditionFields(groupDevices),
                devicesAffected: groupDevices.length,
                isPending: false
              });
            },
            error => this.setState({ error })
          );
        return true;
      }
      return false;
    });
  }

  getConditionFields(devices) {
    const conditions = new Set(); // Using a set to avoid searching the array multiple times in the every
    devices.forEach(({ telemetry = {} }) => {
      Object.values(telemetry).forEach(({ messageSchema: { fields } }) => {
        Object.keys(fields).forEach((field) => {
          if (field.toLowerCase().indexOf('unit') === -1) conditions.add(field);
        })
      })
    })
    return [...conditions.values()].map(field => ({ label: field, value: field }));
  }

  onToggle = ({ target: { value } }) => {
    this.setState({ formData: { ...this.state.formData, enabled: value } })
    this.formControlChange();
  }

  formControlChange = () => {
    if (this.state.changesApplied) {
      this.setState({ changesApplied: false });
    }
  }

  deletePill = link => index => e => {
    link.set(link.value.filter((_, idx) => index !== idx));
  }

  onActionToggle = ({ target: { value } }) => {
    this.setState({ formData: { ...this.state.formData, actionEnabled: value } })
  }

  render() {
    const { onClose, t, deviceGroups = [] } = this.props;
    const {
      changesApplied,
      devicesAffected,
      error,
      fieldOptions,
      fieldQueryPending,
      formData,
      isPending
    } = this.state;
    const calculationOptions = calculations.map(value => ({
      label: t(`rules.flyouts.ruleEditor.calculationOptions.${value.toLowerCase()}`),
      value
    }));
    const deviceGroupOptions = deviceGroups.map(this.toSelectOption);
    // Validators
    const requiredValidator = (new Validator()).check(Validator.notEmpty, t('rules.flyouts.ruleEditor.validation.required'));
    // State links
    this.ruleNameLink = this.formDataLink.forkTo('name').withValidator(requiredValidator);
    this.descriptionLink = this.formDataLink.forkTo('description');
    this.deviceGroupLink = this.formDataLink.forkTo('groupId')
      .map(({ value }) => value)
      .withValidator(requiredValidator);
    this.calculationLink = this.formDataLink.forkTo('calculation').map(({ value }) => value).withValidator(requiredValidator);
    this.timePeriodLink = this.formDataLink.forkTo('timePeriod')
      .map(({ value }) => value)
      .check(
        timePeriod => this.calculationLink.value === calculations[0] ? Validator.notEmpty(timePeriod) : true,
        this.props.t('rules.flyouts.ruleEditor.validation.required')
      );
    this.conditionsLink = this.formDataLink.forkTo('conditions').withValidator(requiredValidator);
    this.actionsLink = this.formDataLink.forkTo('actions').withValidator(requiredValidator);
    this.severityLink = this.formDataLink.forkTo('severity');

    // Create the state link for the dynamic form elements
    const conditionLinks = this.conditionsLink.getLinkedChildren(conditionLink => {
      const fieldLink = conditionLink.forkTo('field').map(({ value }) => value).withValidator(requiredValidator);
      const operatorLink = conditionLink.forkTo('operator').map(({ value }) => value).withValidator(requiredValidator);
      const valueLink = conditionLink.forkTo('value')
        .check(Validator.notEmpty, () => this.props.t('deviceGroupsFlyout.errorMsg.isRequired'))
        .check(val => !isNaN(val), t('rules.flyouts.ruleEditor.validation.nan'));
      const error = fieldLink.error || operatorLink.error || valueLink.error;
      return { fieldLink, operatorLink, valueLink, error };
    });

    const actionLinks = this.actionsLink.getLinkedChildren(actionLink => {
      const emailLink = actionLink.forkTo('parameters')
        .forkTo('email')
        .check(Validator.notEmpty, () => this.props.t('deviceGroupsFlyout.errorMsg.isRequired'));
      const templateLink = actionLink.forkTo('parameters')
        .forkTo('template')
        .check(Validator.notEmpty, () => this.props.t('deviceGroupsFlyout.errorMsg.isRequired'));
      const error = formData.actionEnabled ? (emailLink.error || templateLink.error) : false;
      return { emailLink, templateLink, error };
    });

    const conditionsHaveErrors = conditionLinks.some(({ error }) => error);
    const actionsHaveErrors = actionLinks.some(({ error }) => error);
    const completedSuccessfully = changesApplied && !error;

    return (
      <form onSubmit={this.apply} className="new-rule-flyout-container">
        <Section.Container className="rule-property-container">
          <Section.Content>
            <FormGroup>
              <FormLabel isRequired="true">{t('rules.flyouts.ruleEditor.ruleName')}</FormLabel>
              <FormControl
                type="text"
                className="long"
                placeholder={t('rules.flyouts.ruleEditor.namePlaceholder')}
                onChange={this.formControlChange}
                link={this.ruleNameLink} />
            </FormGroup>
            <FormGroup>
              <FormLabel>{t('rules.flyouts.ruleEditor.description')}</FormLabel>
              <FormControl
                type="textarea"
                placeholder={t('rules.flyouts.ruleEditor.descriptionPlaceholder')}
                onChange={this.formControlChange}
                link={this.descriptionLink} />
            </FormGroup>
            <FormGroup>
              <FormLabel isRequired="true">{t('rules.flyouts.ruleEditor.deviceGroup')}</FormLabel>
              <FormControl
                type="select"
                className="long"
                options={deviceGroupOptions}
                onChange={this.onGroupIdChange}
                clearable={false}
                searchable={true}
                placeholder={t('rules.flyouts.ruleEditor.deviceGroupPlaceholder')}
                link={this.deviceGroupLink} />
            </FormGroup>
            <FormGroup>
              <FormLabel isRequired="true">{t('rules.flyouts.ruleEditor.calculation')}</FormLabel>
              <FormControl
                type="select"
                className="long"
                placeholder={t('rules.flyouts.ruleEditor.calculationPlaceholder')}
                link={this.calculationLink}
                options={calculationOptions}
                onChange={this.formControlChange}
                clearable={false}
                searchable={false} />
            </FormGroup>
            {
              this.calculationLink.value === calculations[0] &&
              <FormGroup>
                <FormLabel isRequired="true">{t('rules.flyouts.ruleEditor.timePeriod')}</FormLabel>
                <FormControl
                  type="select"
                  className="short"
                  onChange={this.formControlChange}
                  link={this.timePeriodLink}
                  options={timePeriodOptions}
                  clearable={false}
                  searchable={false} />
              </FormGroup>
            }
          </Section.Content>
        </Section.Container>
        {
          !fieldQueryPending && <div>
            <Section.Container collapsable={false}>
              <Section.Header>{t('rules.flyouts.ruleEditor.conditions')}</Section.Header>
              <Section.Content>
                <Btn svg={svgs.plus} onClick={this.addCondition}>{t('rules.flyouts.ruleEditor.addCondition')}</Btn>
              </Section.Content>
            </Section.Container>
            {
              conditionLinks.map((condition, idx) => (
                <Section.Container key={formData.conditions[idx].key}>
                  <Section.Header>{t('rules.flyouts.ruleEditor.condition.condition')} {idx + 1}</Section.Header>
                  <Section.Content>
                    <FormGroup>
                      <FormLabel isRequired="true">{t('rules.flyouts.ruleEditor.condition.field')}</FormLabel>
                      <FormControl
                        type="select"
                        className="long"
                        placeholder={t('rules.flyouts.ruleEditor.condition.fieldPlaceholder')}
                        onChange={this.formControlChange}
                        link={condition.fieldLink}
                        options={fieldOptions}
                        clearable={false}
                        searchable={true} />
                    </FormGroup>
                    <FormGroup>
                      <FormLabel isRequired="true">{t('rules.flyouts.ruleEditor.condition.operator')}</FormLabel>
                      <FormControl
                        type="select"
                        className="short"
                        placeholder={t('rules.flyouts.ruleEditor.condition.operatorPlaceholder')}
                        onChange={this.formControlChange}
                        link={condition.operatorLink}
                        options={operatorOptions}
                        clearable={false}
                        searchable={false} />
                    </FormGroup>
                    <FormGroup>
                      <FormLabel isRequired="true">{t('rules.flyouts.ruleEditor.condition.value')}</FormLabel>
                      <FormControl
                        type="text"
                        placeholder={t('rules.flyouts.ruleEditor.condition.valuePlaceholder')}
                        onChange={this.formControlChange}
                        link={condition.valueLink} />
                    </FormGroup>
                    {
                      conditionLinks.length > 1 &&
                      <Btn className="padded-top" svg={svgs.trash} onClick={this.deleteCondition(idx)}>{t('rules.flyouts.ruleEditor.delete')}</Btn>
                    }
                  </Section.Content>
                </Section.Container>
              ))
            }
            <Section.Container collapsable={false}>
              <Section.Header>{t('rules.flyouts.ruleEditor.actions.actions')}</Section.Header>
              <ToggleBtn
                value={formData.actionEnabled}
                onChange={this.onActionToggle} >
                {formData.actionEnabled ? t('rules.flyouts.ruleEditor.actions.on') : t('rules.flyouts.ruleEditor.actions.off')}
              </ToggleBtn>
              <Section.Content>
                {
                  formData.actionEnabled && actionLinks.map((action, idx) => (
                    <Section.Content key={formData.actions[idx].key}>
                      <p className="padded-top">{t('rules.flyouts.ruleEditor.actions.emailAddresses')}</p>
                      <FormGroup>
                        <FormControl
                          type="text"
                          className="long"
                          onKeyPress={this.onAddEmail(action.emailLink)}
                          link={this.newEmailLink}
                          placeholder={t('rules.flyouts.ruleEditor.actions.enterEmail')} />
                      </FormGroup>
                      <PillFormControl
                        pills={action.emailLink.value}
                        svg={svgs.cancelX}
                        onSvgClick={this.deletePill(action.emailLink)} />
                      <p className="padded-top">{t('rules.flyouts.ruleEditor.actions.emailComments')}</p>
                      <FormGroup>
                        <FormControl
                          type="textarea"
                          link={action.templateLink}
                          placeholder={t('rules.flyouts.ruleEditor.actions.enterEmailComments')} />
                      </FormGroup>
                    </Section.Content>
                  ))}
              </Section.Content>
            </Section.Container>
            <Section.Container collapsable={false}>
              <Section.Content>
                <FormGroup className="padded-top">
                  <FormLabel>{t('rules.flyouts.ruleEditor.severityLevel')}</FormLabel>
                  <Radio
                    onChange={this.formControlChange}
                    link={this.severityLink}
                    value={Config.ruleSeverity.critical}>
                    <FormLabel>
                      <SeverityRenderer value={Config.ruleSeverity.critical} context={{ t }} />
                    </FormLabel>
                  </Radio>
                  <Radio
                    onChange={this.formControlChange}
                    link={this.severityLink}
                    value={Config.ruleSeverity.warning}>
                    <FormLabel>
                      <SeverityRenderer value={Config.ruleSeverity.warning} context={{ t }} />
                    </FormLabel>
                  </Radio>
                  <Radio
                    onChange={this.formControlChange}
                    link={this.severityLink}
                    value={Config.ruleSeverity.info}>
                    <FormLabel>
                      <SeverityRenderer value={Config.ruleSeverity.info} context={{ t }} />
                    </FormLabel>
                  </Radio>
                </FormGroup>
              </Section.Content>
              <Section.Content>
                <FormGroup>
                  <FormLabel>{t('rules.flyouts.ruleEditor.ruleStatus')}</FormLabel>
                  <ToggleBtn
                    value={formData.enabled}
                    onChange={this.onToggle} >
                    {formData.enabled ? t('rules.flyouts.ruleEditor.ruleEnabled') : t('rules.flyouts.ruleEditor.ruleDisabled')}
                  </ToggleBtn>
                </FormGroup>
              </Section.Content>
            </Section.Container>

          </div>

        }

        <SummarySection>
          <SectionHeader>{t('rules.flyouts.ruleEditor.summaryHeader')}</SectionHeader>
          <SummaryBody>
            <SummaryCount>{devicesAffected}</SummaryCount>
            <SectionDesc>{t('rules.flyouts.ruleEditor.devicesAffected')}</SectionDesc>
            {isPending && <Indicator />}
            {completedSuccessfully && <Svg className="summary-icon" path={svgs.apply} />}
          </SummaryBody>
        </SummarySection>

        {error && <AjaxError className="rule-editor-error" t={t} error={error} />}
        {
          <BtnToolbar>
            <Btn primary={true} disabled={!!changesApplied || isPending || !this.formIsValid() || conditionsHaveErrors || actionsHaveErrors} type="submit">{t('rules.flyouts.ruleEditor.apply')}</Btn>
            <Btn svg={svgs.cancelX} onClick={onClose}>{t('rules.flyouts.ruleEditor.cancel')}</Btn>
          </BtnToolbar>
        }
      </form>
    );
  }
}
