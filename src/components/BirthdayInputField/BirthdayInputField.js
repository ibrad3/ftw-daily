import React, { Component, PropTypes } from 'react';
import { Field } from 'redux-form';
import classNames from 'classnames';
import { range } from 'lodash';
import { Select, ValidationError } from '../../components';

import css from './BirthdayInputField.css';

// Since redux-form tracks the onBlur event for marking the field as
// touched (which triggers possible error validation rendering), only
// trigger the event asynchronously when no other input within this
// component has received focus.
//
// This prevents showing the validation error when the user selects a
// value and moves on to another input within this component.
const BLUR_TIMEOUT = 100;

const pad = num => {
  if (num >= 0 && num < 10) {
    return `0${num}`;
  }
  return num.toString();
};

const parseNum = str => {
  const num = parseInt(str, 10);
  return isNaN(num) ? null : num;
};

// Validate that the given date has the same info as the selected
// value, i.e. it has not e.g. rolled over to the next month if the
// selected month doesn't have as many days as selected.
//
// Note the UTC handling, we want to deal with UTC date info even
// though the date object itself is in the user's local timezone.
const isValidDate = (date, year, month, day) => {
  const yearsMatch = date.getUTCFullYear() === year;
  const monthsMatch = date.getUTCMonth() + 1 === month;
  const daysMatch = date.getUTCDate() === day;
  return yearsMatch && monthsMatch && daysMatch;
};

// Create a UTC Date from the selected values. Return null if the date
// is invalid.
const dateFromSelected = ({ day, month, year }) => {
  const dayNum = parseNum(day);
  const monthNum = parseNum(month);
  const yearNum = parseNum(year);
  if (dayNum !== null && monthNum !== null && yearNum !== null) {
    const d = new Date(Date.UTC(yearNum, monthNum - 1, dayNum));
    return isValidDate(d, yearNum, monthNum, dayNum) ? d : null;
  }
  return null;
};

// Get the UTC year/month/day info from the date object in local
// timezone.
const selectedFromDate = date => ({
  day: date.getUTCDate(),
  month: date.getUTCMonth() + 1,
  year: date.getUTCFullYear(),
});

// Always show 31 days per month
const days = range(1, 32);
const months = range(1, 13);

// Show a certain number of years up to the current year
const currentYear = new Date().getFullYear();
const yearsToShow = 80;
const years = range(currentYear, currentYear - yearsToShow, -1);

class BirthdayInput extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selected: {
        day: null,
        month: null,
        year: null,
      },
    };
    this.blurTimeoutId = null;
    this.handleSelectFocus = this.handleSelectFocus.bind(this);
    this.handleSelectBlur = this.handleSelectBlur.bind(this);
    this.handleSelectChange = this.handleSelectChange.bind(this);
  }
  componentWillMount() {
    const value = this.props.value;
    if (value instanceof Date) {
      this.setState({ selected: selectedFromDate(value) });
    }
  }
  componentWillReceiveProps(newProps) {
    const oldValue = this.props.value;
    const newValue = newProps.value;
    const valueChanged = oldValue !== newValue;
    if (valueChanged && newValue instanceof Date) {
      this.setState({ selected: selectedFromDate(newValue) });
    }
  }
  componentWillUnmount() {
    window.clearTimeout(this.blurTimeoutId);
  }
  handleSelectFocus() {
    window.clearTimeout(this.blurTimeoutId);
    this.props.onFocus();
  }
  handleSelectBlur() {
    window.clearTimeout(this.blurTimeoutId);
    this.blurTimeoutId = window.setTimeout(
      () => {
        this.props.onBlur();
      },
      BLUR_TIMEOUT
    );
  }
  handleSelectChange(type, value) {
    this.setState(prevState => {
      const selected = { ...prevState.selected, [type]: parseNum(value) };
      this.props.onChange(dateFromSelected(selected));
      return { selected };
    });
  }
  render() {
    const { id } = this.props;

    const selectedValue = n => {
      return typeof n === 'number' ? n : '';
    };

    return (
      <div className={css.inputRoot}>
        <Select
          id={id}
          value={selectedValue(this.state.selected.day)}
          className={css.dropdown}
          onFocus={() => this.handleSelectFocus()}
          onBlur={() => this.handleSelectBlur()}
          onChange={e => this.handleSelectChange('day', e.target.value)}
        >
          <option />
          {days.map(d => <option key={d} value={d}>{pad(d)}</option>)}
        </Select>
        <Select
          value={selectedValue(this.state.selected.month)}
          className={css.dropdown}
          onFocus={() => this.handleSelectFocus()}
          onBlur={() => this.handleSelectBlur()}
          onChange={e => this.handleSelectChange('month', e.target.value)}
        >
          <option />
          {months.map(m => <option key={m} value={m}>{pad(m)}</option>)}
        </Select>
        <Select
          value={selectedValue(this.state.selected.year)}
          className={css.dropdown}
          onFocus={() => this.handleSelectFocus()}
          onBlur={() => this.handleSelectBlur()}
          onChange={e => this.handleSelectChange('year', e.target.value)}
        >
          <option />
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </Select>
      </div>
    );
  }
}

BirthdayInput.defaultProps = { value: null };

const { string, instanceOf, func, object } = PropTypes;

BirthdayInput.propTypes = {
  id: string.isRequired,
  value: instanceOf(Date),
  onChange: func.isRequired,
  onFocus: func.isRequired,
  onBlur: func.isRequired,
};

const BirthdayInputFieldComponent = props => {
  const { rootClassName, className, id, label, input, meta } = props;

  if (label && !id) {
    throw new Error('id required when a label is given');
  }

  const classes = classNames(rootClassName || css.fieldRoot, className);
  const inputProps = { id, ...input };
  return (
    <div className={classes}>
      {label ? <label htmlFor={id}>{label}</label> : null}
      <BirthdayInput {...inputProps} />
      <ValidationError fieldMeta={meta} />
    </div>
  );
};

BirthdayInputFieldComponent.defaultProps = {
  rootClassName: null,
  className: null,
  id: null,
  label: null,
};

BirthdayInputFieldComponent.propTypes = {
  rootClassName: string,
  className: string,
  id: string,
  label: string,
  input: object.isRequired,
  meta: object.isRequired,
};

const BirthdayInputField = props => {
  return <Field component={BirthdayInputFieldComponent} {...props} />;
};

export default BirthdayInputField;
