import PropTypes from 'prop-types';
import React from 'react';
import { listToMap } from '@togglecorp/fujs';

import ModalHeader from '#rscv/Modal/Header';
import ModalBody from '#rscv/Modal/Body';
import ModalFooter from '#rscv/Modal/Footer';
import Faram, {
    requiredCondition,
    greaterThanCondition,
} from '#rscg/Faram';
import FaramGroup from '#rscg/FaramGroup';
import PrimaryButton from '#rsca/Button/PrimaryButton';
import Button from '#rsca/Button';
import NonFieldErrors from '#rsci/NonFieldErrors';

import _ts from '#ts';
import _cs from '#cs';

import {
    RequestCoordinator,
    RequestClient,
    requestMethods,
} from '#request';
import { leadPaneTypeMap, LEAD_PANE_TYPE } from '#entities/lead';

import CsvSettings from './CsvSettings';
import ExcelSettings from './ExcelSettings';
import styles from './styles.scss';

const getFileTypeFromMimeType = (mimeType) => {
    const leadType = leadPaneTypeMap[mimeType];
    return leadType === LEAD_PANE_TYPE.spreadsheet ? 'xlsx' : 'csv';
};

const createFaramValues = (faramValues, meta, fileType) => {
    if (fileType === 'csv') {
        return {
            ...faramValues,
            options: {
                delimiter: ',',
            },
        };
    } else if (fileType === 'xlsx') {
        const { sheets = [] } = meta;
        return {
            ...faramValues,
            options: {
                sheets: listToMap(
                    sheets,
                    sheet => sheet.key,
                    () => ({
                        headerRow: 1,
                    }),
                ),
            },
        };
    }
    return faramValues;
};

const createSchema = (meta, fileType) => {
    if (fileType === 'csv') {
        return {
            fields: {
                options: {
                    fields: {
                        delimiter: [requiredCondition],
                        noHeaders: [],
                    },
                },
                fileType: [],
                title: [],
                file: [],
                project: [],
            },
        };
    } else if (fileType === 'xlsx') {
        const { sheets = [] } = meta;

        const xlsxSchema = listToMap(
            sheets,
            sheet => sheet.key,
            () => ({
                identifier: (val = {}) => (val.skip ? 'skipped' : 'default'),
                fields: {
                    skipped: {
                        skip: [],
                    },
                    default: {
                        skip: [],
                        headerRow: [requiredCondition, greaterThanCondition(0)],
                        noHeaders: [],
                    },
                },
            }),
        );

        return {
            validation: (value = {}) => {
                const errors = [];
                const {
                    options: {
                        sheets: sheetsValue = {},
                    } = {},
                } = value;
                const hasAllSkipped = Object.keys(sheetsValue)
                    .every(key => sheetsValue[key].skip);
                if (hasAllSkipped) {
                    errors.push('All sheets cannot be skipped');
                }
                return errors;
            },
            fields: {
                options: {
                    fields: {
                        sheets: {
                            fields: xlsxSchema,
                        },
                    },
                },
                title: [],
                fileType: [],
                file: [],
                project: [],
            },
        };
    }
    return {};
};


// fileId: attachment.id
// fileType: get from mimetype
const requests = {
    getMetaInfoRequest: {
        method: requestMethods.GET,
        onMount: true,
        url: ({ params: { fileId, fileType } }) => (
            `/meta-extraction/${fileId}/?file_type=${fileType}`
        ),
        onSuccess: ({ params: { fileType, faramValues, setState }, response: meta }) => {
            const newFaramValues = createFaramValues(faramValues, meta, fileType);
            const newSchema = createSchema(meta, fileType);
            setState({
                faramValues: newFaramValues,
                schema: newSchema,
                meta,
            });
        },
    },
    createBookRequest: {
        method: requestMethods.POST,
        url: '/tabular-books/',
        body: ({ params: { body } }) => body,
        onSuccess: ({ params, response }) => {
            params.onComplete(response.id);
        },
        onFailure: ({ error: { faramErrors }, params: { handleFaramError } }) => {
            handleFaramError(faramErrors);
        },
        onFatal: ({ params: { handleFaramError } }) => {
            handleFaramError({
                $internal: ['SERVER ERROR'],
            });
        },
    },
};

const propTypes = {
    className: PropTypes.string,
    mimeType: PropTypes.string,
    lead: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
    setTabularBook: PropTypes.func.isRequired, // eslint-disable-line react/no-unused-prop-types
    onCancel: PropTypes.func.isRequired,
};

const defaultProps = {
    className: '',
    mimeType: '',
};


@RequestCoordinator
@RequestClient(requests)
export default class LeadTabular extends React.PureComponent {
    static propTypes = propTypes;
    static defaultProps = defaultProps;

    constructor(props) {
        super(props);

        const {
            mimeType,
            lead: { faramValues },
            getMetaInfoRequest,
        } = this.props;

        const {
            title,
            project,
            attachment,
        } = faramValues;

        const fileType = getFileTypeFromMimeType(mimeType);

        const newFaramValues = {
            title,
            project,
            file: attachment.id,
            fileType,
        };

        getMetaInfoRequest.setDefaultParams({
            fileId: attachment.id,
            fileType,
            faramValues: newFaramValues,
            setState: val => this.setState(val),
        });

        this.state = {
            fileType,
            schema: undefined,
            faramValues: newFaramValues,
            faramErrors: {},
            hasError: false,
        };
    }

    handleComplete = (bookId) => {
        const { setTabularBook } = this.props;
        setTabularBook(bookId);
    }

    handleFaramChange = (faramValues, faramErrors, faramInfo) => {
        this.setState({
            faramValues,
            faramErrors,
            hasError: faramInfo.hasError,
        });
    }

    handleFaramValidationFailure = (faramErrors) => {
        this.setState({ faramErrors, hasError: true });
    }

    handleFaramValidationSuccess = (faramValues) => {
        this.props.createBookRequest.do({
            body: faramValues,
            handleFaramError: this.handleFaramValidationFailure,
            onComplete: this.handleComplete,
        });
    }

    renderBody = () => {
        const {
            onCancel,
            getMetaInfoRequest,
            createBookRequest,
        } = this.props;
        const {
            fileType,
            schema,
            faramValues,
            faramErrors,
            hasError,
            meta,
        } = this.state;

        const {
            pending,
            error,
        } = getMetaInfoRequest;

        if (pending) {
            return 'pending';
        }
        if (error) {
            return 'error';
        }

        const { pending: savePending } = createBookRequest;

        // NOTE: Default component should be null but FaramGroup doesn't
        // support null child yet.
        const component = (
            (fileType === 'csv' && <CsvSettings />) ||
            (fileType === 'xlsx' &&
                <ExcelSettings
                    meta={meta}
                    sheets={faramValues.options.sheets}
                    disabled={savePending}
                />
            )
        );

        return (
            <Faram
                className={styles.form}
                onChange={this.handleFaramChange}
                onValidationFailure={this.handleFaramValidationFailure}
                onValidationSuccess={this.handleFaramValidationSuccess}
                schema={schema}
                value={faramValues}
                error={faramErrors}
                disabled={savePending}
            >
                <ModalBody className={styles.body} >
                    <NonFieldErrors faramElement />
                    { component &&
                        <FaramGroup faramElementName="options">
                            {component}
                        </FaramGroup>
                    }
                </ModalBody>
                <ModalFooter>
                    <Button onClick={onCancel}>
                        {_ts('addLeads.tabular', 'cancelButtonTitle')}
                    </Button>
                    <PrimaryButton
                        type="submit"
                        pending={savePending}
                        disabled={hasError}
                    >
                        {_ts('addLeads.tabular', 'extractButtonTitle')}
                    </PrimaryButton>
                </ModalFooter>
            </Faram>
        );
    }

    render() {
        const { className } = this.props;
        const Body = this.renderBody;

        return (
            <div
                className={_cs(
                    className,
                    styles.leadTabular,
                )}
            >
                <ModalHeader title={_ts('addLeads.tabular', 'title')} />
                <Body />
            </div>
        );
    }
}
