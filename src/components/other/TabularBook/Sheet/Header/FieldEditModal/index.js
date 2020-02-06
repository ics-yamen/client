import PropTypes from 'prop-types';
import React from 'react';
import Faram, { FaramGroup, requiredCondition } from '@togglecorp/faram';

import Button from '#rsca/Button';
import DangerButton from '#rsca/Button/DangerButton';
import PrimaryButton from '#rsca/Button/PrimaryButton';
import NonFieldErrors from '#rsci/NonFieldErrors';
import NumberInput from '#rsci/NumberInput';
import SegmentInput from '#rsci/SegmentInput';
import SelectInput from '#rsci/SelectInput';
import TextInput from '#rsci/TextInput';
import FloatingContainer from '#rscv/FloatingContainer';
import {
    calcFloatPositionInMainWindow,
    defaultOffset,
    defaultLimit,
} from '#rsu/bounds';

import { DATA_TYPE } from '#entities/tabular';
import _ts from '#ts';
import ProjectRegionsTooltip from './ProjectRegionsTooltip';

import styles from './styles.scss';

const DATE_FORMATS = [
    { format: '%m-%d-%Y', label: '03-24-2005' },
    { format: '%m/%d/%Y', label: '03/24/2005' },
    { format: '%m.%d.%Y', label: '03.24.2005' },
    { format: '%m %d %Y', label: '03 24 2005' },
    { format: '%Y-%m-%d', label: '2005-03-24' },
    { format: '%Y/%m/%d', label: '2005/03/24' },
    { format: '%Y.%m.%d', label: '2005.03.24' },
    { format: '%Y %m %d', label: '2005 03 24' },
    { format: '%d %b %Y', label: '24 Mar 2005' },
    { format: '%d-%b-%Y', label: '24-Mar-2005' },
    { format: '%d/%b/%Y', label: '24/Mar/2005' },
    { format: '%d.%b.%Y', label: '24.Mar.2005' },
    { format: '%Y %b %d', label: '2005 Mar 24' },
    { format: '%Y %B %d', label: '2005 March 24' },
    { format: '%d %B %Y', label: '24 March 2005' },
    { format: '%d-%m-%Y', label: '24-03-2005' },
    { format: '%d/%m/%Y', label: '24/03/2005' },
    { format: '%d.%m.%Y', label: '24.03.2005' },
    { format: '%d %m %Y', label: '24 03 2005' },
];

const fieldTypes = [
    { key: DATA_TYPE.string, label: 'String' },
    { key: DATA_TYPE.number, label: 'Number' },
    { key: DATA_TYPE.datetime, label: 'Date' },
    { key: DATA_TYPE.geo, label: 'Geo' },
];

const separatorOptions = [
    { key: 'space', label: 'Space' },
    { key: 'comma', label: 'Comma' },
    { key: 'none', label: 'None' },
];

const geoTypeOptions = [
    { key: 'name', label: 'Name' },
    { key: 'code', label: 'Code' },
];

export default class FieldEditModal extends React.PureComponent {
    static propTypes = {
        onFieldEdit: PropTypes.func.isRequired,
        onFieldDelete: PropTypes.func.isRequired,
        fieldId: PropTypes.number.isRequired,
        closeModal: PropTypes.func,
        disabled: PropTypes.bool,
        disabledDelete: PropTypes.bool,
        // eslint-disable-next-line react/forbid-prop-types
        value: PropTypes.object.isRequired,
        // eslint-disable-next-line react/forbid-prop-types
        projectRegions: PropTypes.object.isRequired,
    };

    static defaultProps = {
        closeModal: () => {},
        disabled: false,
        disabledDelete: false,
    }

    static fieldKeySelector = d => d.id;
    static getFormatValue = x => x.format;
    static getLabelValue = x => x.label;

    constructor(props) {
        super(props);

        const { value } = this.props;

        this.state = {
            value,
            error: {},
            hasError: false,
            pristine: true,
        };

        const commonFields = {
            id: [requiredCondition],
            title: [requiredCondition],
            type: [requiredCondition],
            ordering: [],
            hidden: [],
        };
        this.schema = {
            identifier: (val = {}) => val.type,
            fields: { // the name of the actual field is "fields"
                default: {
                    ...commonFields,
                },
                [DATA_TYPE.string]: {
                    ...commonFields,
                },
                [DATA_TYPE.number]: {
                    ...commonFields,
                    options: {
                        fields: {
                            separator: [requiredCondition],
                        },
                    },
                },
                [DATA_TYPE.geo]: {
                    ...commonFields,
                    options: {
                        fields: {
                            geoType: [requiredCondition],
                            adminLevel: [requiredCondition],
                        },
                    },
                },
                [DATA_TYPE.datetime]: {
                    ...commonFields,
                    options: {
                        fields: {
                            dateFormat: [requiredCondition],
                        },
                    },
                },
            },
        };
    }

    handleFaramChange = (faramValues, faramErrors, faramInfo) => {
        this.setState({
            value: faramValues,
            error: faramErrors,
            pristine: false,
            hasError: faramInfo.hasError,
        });
    };

    handleFaramValidationFailure = (faramErrors) => {
        this.setState({ error: faramErrors });
    };

    handleFaramValidationSuccess = (value) => {
        const {
            onFieldEdit,
            fieldId,
            closeModal,
        } = this.props;

        onFieldEdit(fieldId, value);
        closeModal();
    };

    handleDeleteClick = () => {
        const {
            onFieldDelete,
            fieldId,
            closeModal,
        } = this.props;

        onFieldDelete(fieldId);
        closeModal();
    }

    handleInvalidate = (container) => {
        // Note: pass through prop
        // eslint-disable-next-line react/prop-types
        const { parentBCR } = this.props;
        const {
            value: {
                type,
            },
        } = this.state;

        const contentRect = container.getBoundingClientRect();

        const optionsContainerPosition = (
            calcFloatPositionInMainWindow({
                parentRect: parentBCR,
                contentRect,
                defaultOffset,
                limit: {
                    ...defaultLimit,
                    maxW: type === DATA_TYPE.geo ? 480 : 240,
                    minW: type === DATA_TYPE.geo ? 480 : 240,
                },
            })
        );

        return optionsContainerPosition;
    }

    renderSettingsForType = (type) => {
        if (type === DATA_TYPE.number) {
            return (
                <SegmentInput
                    faramElementName="separator"
                    label={_ts('tabular.fieldEditModal', 'separatorTitle')} // Separator
                    options={separatorOptions}
                />
            );
        }

        if (type === DATA_TYPE.geo) {
            return (
                <React.Fragment>
                    <SegmentInput
                        faramElementName="geoType"
                        label={_ts('tabular.fieldEditModal', 'geoTypeTitle')} // Geo Type
                        options={geoTypeOptions}
                    />
                    <NumberInput
                        faramElementName="adminLevel"
                        label={_ts('tabular.fieldEditModal', 'adminLevelTitle')} // Admin Level
                        separator=" "
                    />
                </React.Fragment>
            );
        }

        if (type === DATA_TYPE.datetime) {
            return (
                <SelectInput
                    faramElementName="dateFormat"
                    label={_ts('tabular.fieldEditModal', 'dateFormatTitle')} // Date Format
                    options={DATE_FORMATS}
                    keySelector={FieldEditModal.getFormatValue}
                    labelSelector={FieldEditModal.getLabelValue}
                    hideClearButton
                />
            );
        }

        return <div />;
    }

    render() {
        const {
            closeModal,
            disabled,
            disabledDelete,
            projectRegions,
        } = this.props;

        const {
            value,
            error,
            hasError,
            pristine,
        } = this.state;

        const { type } = value;

        return (
            <FloatingContainer
                key={type}
                className={styles.container}
                onInvalidate={this.handleInvalidate}
                closeOnEscape
                onClose={closeModal}
                focusTrap
                showHaze
            >
                <Faram
                    onChange={this.handleFaramChange}
                    className={styles.faram}
                    onValidationFailure={this.handleFaramValidationFailure}
                    onValidationSuccess={this.handleFaramValidationSuccess}

                    schema={this.schema}
                    value={value}
                    error={error}
                    disabled={disabled}
                >
                    <div className={styles.left} >
                        <div className={styles.top}>
                            <NonFieldErrors
                                className={styles.nonFieldErrors}
                                faramElement
                            />
                            <DangerButton
                                className={styles.removeColumnButton}
                                disabled={disabled || disabledDelete}
                                onClick={this.handleDeleteClick}
                                iconName="trash"
                                title={_ts('tabular.fieldEditModal', 'deleteFieldButtonLabel')}
                                transparent
                            />
                        </div>
                        <TextInput
                            faramElementName="title"
                            label={_ts('tabular.fieldEditModal', 'fieldNameTitle')} // Title
                            autoFocus
                        />
                        <SegmentInput
                            faramElementName="type"
                            label={_ts('tabular.fieldEditModal', 'fieldTypeTitle')} // Type
                            options={fieldTypes}
                        />

                        <FaramGroup faramElementName="options">
                            {this.renderSettingsForType(type)}
                        </FaramGroup>

                        <div className={styles.actionButtons}>
                            <Button onClick={closeModal}>
                                {_ts('tabular.fieldEditModal', 'cancelFieldButtonLabel')}
                            </Button>
                            <PrimaryButton
                                type="submit"
                                disabled={disabled || hasError || pristine}
                            >
                                {_ts('tabular.fieldEditModal', 'saveFieldButtonLabel') /* Save Field */ }
                            </PrimaryButton>
                        </div>
                    </div>
                    {type === DATA_TYPE.geo &&
                        <ProjectRegionsTooltip
                            className={styles.right}
                            regions={projectRegions.regions}
                        />
                    }
                </Faram>
            </FloatingContainer>
        );
    }
}

