// Copyright (c) Microsoft. All rights reserved.

import React from 'react';

import {
  Btn,
  BtnToolbar,
  FormControl,
  FormGroup,
  FormLabel,
  Radio,
  ToggleBtn,
  SectionDesc,
  SectionHeader,
  SummaryBody,
  SummaryCount,
  SummarySection,
  AjaxError,
  Indicator
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

//pls work
const actionOptions = [
  { label: 'Send SMS', value: 'SMS' },
  { label: 'Send email', value: 'Email' },
  /*{ label: 'Send SMS and email', value: 'SMS/Email' },*/
  { label: 'No action', value: 'none' }
]

// A counter for creating unique keys per new condition
let conditionKey = 0;

//pls work
// A counter for creating unique keys per new action
let actionKey = 0;

// Creates a state object for a condition
const newCondition = () => ({
  field: '',
  operator: operatorOptions[0].value,
  value: '',
  key: conditionKey++ // Used by react to track the rendered elements
});

//pls work
const newAction = () => ({
  actionItem: actionOptions[0].value,
  emailAddresses: [],
  emailTemplate: '',
  smsNumbers: [],
  smsTemplate: '',
  key: actionKey++
});

// A state object for a new rule
const newRule = {
  name: '',
  description: '',
  groupId: '',
  calculation: '',
  timePeriod: '',
  conditions: [newCondition()], // Start with one condition
  //pls work
  actions: [newAction()], // Start with one action
  severity: Config.ruleSeverity.critical,
  enabled: true
}

export class RuleEditor extends LinkedComponent {

  constructor(props) {
    super(props);

    this.state = {
      error: undefined,
      fieldOptions: [],
      fieldQueryPending: true,
      actionQueryType: "none",
      devicesAffected: 0,
      formData: newRule,
      isPending: false
    };
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

      //pls work
      actions: (rule.actions || []).map(action => ({
        ...action,
        key: actionKey++
      }))
    }
  });

  componentWillUnmount() {
    if (this.subscription) this.subscription.unsubscribe();
  }

  toSelectOption = ({ id, displayName }) => ({ label: displayName, value: id });

  addCondition = () => this.conditionsLink.set([...this.conditionsLink.value, newCondition()]);

  // pls work
  addAction = () => this.actionsLink.set([...this.actionsLink.value, newAction()]);

  deleteCondition = (index) =>
    (evt) => this.conditionsLink.set(this.conditionsLink.value.filter((_, idx) => index !== idx));

  // pls work
  deleteAction = (index) =>
    (evt) => this.actionsLink.set(this.actionsLink.value.filter((_, idx) => index !== idx));

  formIsValid() {
    return [
      this.ruleNameLink,
      this.deviceGroupLink,
      this.conditionsLink,
      //pls work
      this.actionsLink,
      this.timePeriodLink,
      this.calculationLink
    ].every(link => !link.error);
  }

  apply = (event) => {
    event.preventDefault();
    const { onClose, insertRule, updateRule } = this.props;
    const requestProps = { ...this.state.formData };
    const { devicesAffected } = this.state;
    if (requestProps.calculation === calculations[1]) requestProps.timePeriod = '';
    if (this.formIsValid()) {
      this.setState({ isPending: true });
      if (this.subscription) this.subscription.unsubscribe();
      const countProps = {
        count: {
          response: devicesAffected,
          error: undefined
        },
        lastTrigger: {
          response: undefined,
          //should this be error?
          erroe: undefined
        }
      };
      if (this.props.rule) { // If rule object exist then update the existing rule
        this.subscription = TelemetryService.updateRule(this.props.rule.id, toNewRuleRequestModel(requestProps))
          .subscribe(
            (updatedRule) => {
              updateRule({ ...updatedRule, ...countProps });
              this.setState({ isPending: false });
              onClose();
            },
            error => this.setState({ error, isPending: false })
          );
      } else { // If rule object doesn't exist then create a new rule
        this.subscription = TelemetryService.createRule(toNewRuleRequestModel(requestProps))
          .subscribe(
            (createdRule) => {
              insertRule({ ...createdRule, ...countProps });
              this.setState({ isPending: false });
              onClose();
            },
            error => this.setState({ error, isPending: false })
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
  }

  //pls work
  onActionTypeChange = ({ target: { value: { value = {} } } }) => {
    this.setState({
      actionQueryType: value
    });
  }

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

  //todo toggle button didn't support link
  onToggle = ({ target: { value } }) => {
    this.setState({ formData: { ...this.state.formData, enabled: value } })
  }

  render() {
    const { onClose, t, deviceGroups = [] } = this.props;
    const { error, formData, fieldOptions, devicesAffected, isPending, fieldQueryPending, actionQueryType } = this.state;
    const calculationOptions = calculations.map(value => ({
      label: t(`rules.flyouts.ruleEditor.calculationOptions.${value.toLowerCase()}`),
      value
    }));
    const deviceGroupOptions = deviceGroups.map(this.toSelectOption);
    // Validators
    const requiredValidator = (new Validator()).check(Validator.notEmpty, t('rules.flyouts.ruleEditor.validation.required'));
    // State links
    this.formDataLink = this.linkTo('formData');
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

    //pls work
    this.actionsLink = this.formDataLink.forkTo('actions').withValidator(requiredValidator);

    this.severityLink = this.formDataLink.forkTo('severity');
    //todo toggle button didn't support link
    this.enabledLink = this.formDataLink.forkTo('enabled');
    // Create the state link for the dynamic form elements
    const conditionLinks = this.conditionsLink.getLinkedChildren(conditionLink => {
      const fieldLink = conditionLink.forkTo('field').map(({ value }) => value).withValidator(requiredValidator);
      const operatorLink = conditionLink.forkTo('operator').map(({ value }) => value).withValidator(requiredValidator);
      const valueLink = conditionLink.forkTo('value')
        .check(Validator.notEmpty, () => this.props.t('deviceGroupsFlyout.errorMsg.nameCantBeEmpty'))
        .check(val => !isNaN(val), t('rules.flyouts.ruleEditor.validation.nan'));
      const error = fieldLink.error || operatorLink.error || valueLink.error;
      return { fieldLink, operatorLink, valueLink, error };
    });

    //pls work
    const actionLinks = this.actionsLink.getLinkedChildren(actionLink => {
      const actionItemLink = actionLink.forkTo('actionItem').map(({ value }) => value);
      const emailAddressesLink = actionLink.forkTo('emailAddresses');
      const emailTemplateLink = actionLink.forkTo('emailTemplate');
      const smsNumbersLink = actionLink.forkTo('smsNumbers');
      const smsTemplateLink = actionLink.forkTo('smsTemplate');

      const error = actionItemLink.error || emailAddressesLink.error || emailTemplateLink.error || smsNumbersLink.error || smsTemplateLink.error;
      return { actionItemLink, emailAddressesLink, emailTemplateLink, smsNumbersLink, smsTemplateLink };
    });

    const conditionsHaveErrors = conditionLinks.some(({ error }) => error);

    //pls work
    const actionsHaveErrors = actionLinks.some(({ error }) => error);

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
                link={this.ruleNameLink} />
            </FormGroup>
            <FormGroup>
              <FormLabel>{t('rules.flyouts.ruleEditor.description')}</FormLabel>
              <FormControl
                type="textarea"
                placeholder={t('rules.flyouts.ruleEditor.descriptionPlaceholder')}
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
                onChange={this.onCalculationChange}
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



            {
              <Section.Container collapsable={false}>
                <Section.Header>Actions</Section.Header>
                <Section.Content>
                  <Btn svg={svgs.plus} onClick={this.addAction}>Add action</Btn>
                </Section.Content>
                {actionLinks.map((action, idx) => (
                  <Section.Container key={formData.actions[idx].key}>
                    <Section.Header>Action {idx + 1}</Section.Header>

                    <Section.Content>
                      <Section.Content>
                        <FormGroup>
                          <FormLabel isRequired="true">Choose an action</FormLabel>
                          <FormControl
                            type="select"
                            className="long"
                            placeholder="Select action"
                            options={actionOptions}
                            clearable={false}
                            onChange={this.onActionTypeChange}
                            link={action.actionItemLink}
                            searchable={false} />
                        </FormGroup>
                      </Section.Content>

                      {actionQueryType === "Email" ?
                        <div>
                          <Section.Content>
                            <FormGroup>
                              <FormLabel isRequired="true">Email addresses</FormLabel>
                              <FormControl
                                type="text"
                                className="long"
                                link={action.emailAddressesLink}
                                placeholder='Enter email of notification recipients' />
                            </FormGroup>
                            <FormGroup>
                              <FormLabel>Email comments</FormLabel>
                              <FormControl
                                type="textarea"
                                link={action.emailTemplateLink}
                                placeholder='Enter comments for the email recipient' />
                            </FormGroup>
                          </Section.Content>
                        </div>


                        : actionQueryType === "SMS" ?
                          <div>
                            <Section.Content>
                              <FormGroup>
                                <FormLabel isRequired="true">Phone numbers</FormLabel>
                                <FormControl
                                  type="text"
                                  className="long"
                                  link={action.smsNumbersLink}
                                  placeholder='Enter phone number of notification recipients' />
                              </FormGroup>
                              <FormGroup>
                                <FormLabel>Message comments</FormLabel>
                                <FormControl
                                  type="textarea"
                                  link={action.smsTemplateLink}
                                  placeholder='Enter comments for the text recipient' />
                              </FormGroup>
                            </Section.Content>
                          </div>
                          : actionQueryType === "SMS/Email" ?

                            <div>
                              <Section.Content>
                                <FormGroup>
                                  <FormLabel isRequired="true">Email addresses</FormLabel>
                                  <FormControl
                                    type="text"
                                    className="long"
                                    link={action.emailAddressesLink}
                                    placeholder='Enter email of notification recipients' />
                                </FormGroup>
                                <FormGroup>
                                  <FormLabel isRequired="true">Phone numbers</FormLabel>
                                  <FormControl
                                    type="text"
                                    className="long"
                                    link={action.smsNumbersLink}
                                    placeholder='Enter phone number of notification recipients' />
                                </FormGroup>
                                <FormGroup>
                                  <FormLabel>Message comments</FormLabel>
                                  <FormControl
                                    type="textarea"
                                    link={action.smsTemplateLink}
                                    placeholder='Enter comments for the notification recipient' />
                                </FormGroup>
                              </Section.Content>

                            </div>
                            : <div></div>
                      }
                      {
                        actionLinks.length > 1 &&
                        <Btn className="padded-top" svg={svgs.trash} onClick={this.deleteAction(idx)}>{t('rules.flyouts.ruleEditor.delete')}</Btn>
                      }
                    </Section.Content>
                  </Section.Container>
                ))}
              </Section.Container>
            }






            <Section.Container collapsable={false}>
              <Section.Content>
                <FormGroup className="padded-top">
                  <FormLabel>{t('rules.flyouts.ruleEditor.severityLevel')}</FormLabel>
                  <Radio
                    link={this.severityLink}
                    value={Config.ruleSeverity.critical}>
                    <FormLabel>
                      <SeverityRenderer value={Config.ruleSeverity.critical} context={{ t }} />
                    </FormLabel>
                  </Radio>
                  <Radio
                    link={this.severityLink}
                    value={Config.ruleSeverity.warning}>
                    <FormLabel>
                      <SeverityRenderer value={Config.ruleSeverity.warning} context={{ t }} />
                    </FormLabel>
                  </Radio>
                  <Radio
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
            {
              /*
              TODO: Change interaction pattern.
              - Make the flyout stay open to give the user visual confirmation of success.
                    completedSuccessfully && <Svg className="summary-icon" path={svgs.apply} />
              - Update the redux store in the background.
              - Also, allow for additional changes to be made while the flyout is open.
              */
            }
          </SummaryBody>
        </SummarySection>

        {error && <AjaxError t={t} error={error} />}
        {
          !isPending &&
          <BtnToolbar>
            <Btn svg={svgs.apply} primary={true} type="submit" disabled={!this.formIsValid() || conditionsHaveErrors}>{t('rules.flyouts.ruleEditor.apply')}</Btn>
            <Btn svg={svgs.cancelX} onClick={onClose}>{t('rules.flyouts.ruleEditor.cancel')}</Btn>
          </BtnToolbar>
        }
      </form>
    );
  }
}
