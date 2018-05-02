// Copyright (c) Microsoft. All rights reserved.
/* This file contains default values useful for creating PcsGrid */

/** The default value for PcsGrid cells that are empty */
export const EMPTY_FIELD_VAL = '---';

/** The default formatting for dates in the PcsGrid */
export const DEFAULT_TIME_FORMAT = 'hh:mm:ss A MM.DD.YYYY';

/** The string representing an unknown future date (also, max date) */
export const MAX_DATE_STRING = '9999-12-30T23:59:59.9999999Z';

/** A collection of reusable value formatter methods */
export const gridValueFormatters = {
  checkForEmpty: (value, emptyValue = EMPTY_FIELD_VAL) => value || emptyValue
};
