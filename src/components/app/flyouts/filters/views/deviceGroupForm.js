// Copyright (c) Microsoft. All rights reserved.

import React from 'react';

import { svgs, LinkedComponent, Validator } from 'utilities';
import {
  Btn,
  BtnToolbar,
  FormControl,
  FormGroup,
  FormLabel,
} from 'components/shared';

import Flyout from 'components/shared/flyout';

const Section = Flyout.Section;

const deviceGroupNameValidator = (new Validator())
  .check(Validator.notEmpty, 'Name is required');

// Condition validators
const fieldValidator = (new Validator())
  .check(Validator.notEmpty, 'Field is required');

const operatorValidator = (new Validator())
  .check(Validator.notEmpty, 'Operator is required');

const valueValidator = (new Validator())
  .check(Validator.notEmpty, 'Value is required');

const typeValidator = (new Validator())
  .check(Validator.notEmpty, 'Type is required');

// A counter for creating unique keys per new condition
let conditionKey = 0;

// Creates a state object for a condition
const newCondition = () => ({
  field: undefined,
  operator: undefined,
  type: undefined,
  value: undefined,
  key: conditionKey++ // Used by react to track the rendered elements
});

class DeviceGroupForm extends LinkedComponent {

  constructor(props) {
    super(props);

    this.state = {
      name: '',
      conditions: [newCondition()]
    };

    // State to input links
    this.name = this.linkTo('name')
      .withValidator(deviceGroupNameValidator);
    this.conditions = this.linkTo('conditions');
  }

  formIsValid() {
    return [
      this.name,
      this.conditions
    ].every(link => !link.error);
  }

  componentDidMount() {
    if (this.props.editDeviceGroup) {
      this.getFormState(this.props);
    }
  }

  getFormState = ({
    editDeviceGroup,
    selectedDeviceGroup: {
      conditions, displayName, id, eTag
    }
  }) => {
    if (!editDeviceGroup) return;

    this.setState({
      name: displayName,
      conditions
    })
  }

  toSelectOption = ({ id, name }) => ({ value: id, label: name });

  apply = (event) => {
    event.preventDefault();
    // TODO: calling new device group API
  };

  addCondition = () => this.conditions.set([...this.conditions.value, newCondition()]);

  deleteCondition = (index) =>
    () => this.conditions.set(this.conditions.value.filter((_, idx) => index !== idx));

  render () {
    const { t, editDeviceGroup } = this.props;

    // Create the state link for the dynamic form elements
    const conditionLinks = this.conditions.getLinkedChildren(conditionLink => {
      const field = conditionLink.forkTo('field')
        .withValidator(fieldValidator);
      const operator = conditionLink.forkTo('operator')
        .withValidator(operatorValidator);
      const value = conditionLink.forkTo('value')
        .withValidator(valueValidator);
      const type = conditionLink.forkTo('type')
        .withValidator(typeValidator);
      const edited = !(!field.value && !operator.value && !value.value && !type.value);
      const error = (edited && (field.error || operator.error || value.error || type.error)) || '';
      return { field, operator, value, type, edited, error };
    });

    const editedConditions = conditionLinks.filter(({ edited }) => edited);
    const conditionHasErrors = editedConditions.some(({ error }) => !!error);
    const conditionsHaveErrors = editedConditions.length === 0 || conditionHasErrors

    const operatorOptions = [
      {
        value: 'EQ',
        label: t('deviceGroupsFlyout.options.EQ')
      },
      {
        value: 'GT',
        label: t('deviceGroupsFlyout.options.GT')
      },
      {
        value: 'LT',
        label: t('deviceGroupsFlyout.options.LT')
      },
      {
        value: 'GE',
        label: t('deviceGroupsFlyout.options.GE')
      },
      {
        value: 'LE',
        label: t('deviceGroupsFlyout.options.LE')
      },
      {
        value: '[]',
        label: t('deviceGroupsFlyout.options.BRACKET')
      },
      {
        value: '[',
        label: t('deviceGroupsFlyout.options.OPENBRACKET')
      },
      {
        value: ']',
        label: t('deviceGroupsFlyout.options.CLOSEBRACKET')
      }
    ];
    const typeOptions = [
      {
        value: 'Number',
        label: t('deviceGroupsFlyout.options.Number')
      },
      {
        value: 'Text',
        label: t('deviceGroupsFlyout.options.Text')
      }
    ];

    return (
      <form onSubmit={this.apply} className='new-filter-form-container'>
        <Section.Container collapsable={false}>
          <Section.Header>{editDeviceGroup ? t('deviceGroupsFlyout.edit') : t('deviceGroupsFlyout.new')}</Section.Header>
          <Section.Content>
            <FormGroup>
              <FormLabel isRequired="true">{t('deviceGroupsFlyout.name')}</FormLabel>
              <FormControl
                type="text"
                className="long"
                placeholder={t('deviceGroupsFlyout.namePlaceHolder')}
                link={this.name} />
            </FormGroup>
            <Btn className="add-btn" svg={svgs.plus} onClick={this.addCondition}>{t(`rulesFlyout.addCondition`)}</Btn>
            {
              conditionLinks.map((condition, idx) => (
                <Section.Container key={this.state.conditions[idx].key} collapsable={false}>
                  <Section.Header>{t('deviceGroupsFlyout.conditions.condition')} {idx + 1}</Section.Header>
                  <Section.Content>
                    {
                      conditionLinks.length > 1 &&
                      <Btn svg={svgs.trash} onClick={this.deleteCondition(idx)}>Delete</Btn>
                    }
                    <FormGroup>
                      <FormLabel isRequired="true">{t('deviceGroupsFlyout.conditions.field')}</FormLabel>
                      <FormControl
                        type="select"
                        className="long"
                        clearable={false}
                        placeholder={t('deviceGroupsFlyout.conditions.field')}
                        link={condition.field} />
                    </FormGroup>
                    <FormGroup>
                      <FormLabel isRequired="true">{t('deviceGroupsFlyout.conditions.operator')}</FormLabel>
                      <FormControl
                        type="select"
                        className="long"
                        clearable={false}
                        options={operatorOptions}
                        placeholder={t('deviceGroupsFlyout.conditions.operatorPlaceholder')}
                        link={condition.operator} />
                    </FormGroup>
                    <FormGroup>
                      <FormLabel isRequired="true">{t('deviceGroupsFlyout.conditions.value')}</FormLabel>
                      <FormControl
                        type="text"
                        placeholder={t('deviceGroupsFlyout.conditions.valuePlaceholder')}
                        link={condition.value} />
                    </FormGroup>
                    <FormGroup>
                      <FormLabel isRequired="true">{t('deviceGroupsFlyout.conditions.type')}</FormLabel>
                      <FormControl
                        type="select"
                        className="short"
                        clearable={false}
                        options={typeOptions}
                        placeholder={t('deviceGroupsFlyout.conditions.typePlaceholder')}
                        link={condition.type} />
                    </FormGroup>
                  </Section.Content>
                </Section.Container>
              ))
            }
            <BtnToolbar>
              <Btn
                primary
                disabled={!this.formIsValid() || conditionsHaveErrors}
                type="submit">
                {t('deviceGroupsFlyout.save')}
              </Btn>
              <Btn svg={svgs.cancelX} onClick={this.props.cancel}>{t('deviceGroupsFlyout.cancel')}</Btn>
            </BtnToolbar>
          </Section.Content>
        </Section.Container>
      </form>
    );
  }
}

export default DeviceGroupForm;
