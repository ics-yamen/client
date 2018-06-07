import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Button from '#rs/components/Action/Button';
import DangerButton from '#rs/components/Action/Button/DangerButton';
import Faram from '#rs/components/Input/Faram';
import SelectInput from '#rs/components/Input/SelectInput';
import MultiSelectInput from '#rs/components/Input/MultiSelectInput';
import SearchInput from '#rs/components/Input/SearchInput';
import { isObjectEmpty } from '#rs/utils/common';

import {
    discoverProjectsFiltersSelector,

    setDiscoverProjectsFilterAction,
    unsetDiscoverProjectsFilterAction,

    setDiscoverProjectsProjectOptionsAction,
    discoverProjectsProjectOptionsSelector,
} from '#redux';
import _ts from '#ts';

import ProjectOptionsRequest from './requests/ProjectOptionsRequest';

const propTypes = {
    className: PropTypes.string,
    applyOnChange: PropTypes.bool,

    // eslint-disable-next-line react/forbid-prop-types
    filters: PropTypes.object.isRequired,

    setDiscoverProjectFilter: PropTypes.func.isRequired,
    unsetDiscoverProjectFilter: PropTypes.func.isRequired,
    setDiscoverProjectProjectOptions: PropTypes.func.isRequired,

    // eslint-disable-next-line react/forbid-prop-types
    projectOptions: PropTypes.object.isRequired,
};

const defaultProps = {
    className: '',
    applyOnChange: false,
    filters: {},
};

const mapStateToProps = state => ({
    filters: discoverProjectsFiltersSelector(state),
    projectOptions: discoverProjectsProjectOptionsSelector(state),
});

const mapDispatchToProps = dispatch => ({
    setDiscoverProjectFilter: params => dispatch(
        setDiscoverProjectsFilterAction(params),
    ),
    unsetDiscoverProjectFilter: params => dispatch(
        unsetDiscoverProjectsFilterAction(params),
    ),
    setDiscoverProjectProjectOptions: params => dispatch(
        setDiscoverProjectsProjectOptionsAction(params),
    ),
});

@connect(mapStateToProps, mapDispatchToProps)
export default class FilterProjectsForm extends React.PureComponent {
    static propTypes = propTypes;
    static defaultProps = defaultProps;

    static optionLabelSelector = (d = {}) => d.value;
    static optionKeySelector = (d = {}) => d.key;

    constructor(props) {
        super(props);

        this.state = {
            faramValues: this.props.filters,
            pristine: true,
            pendingProjectOptionss: false,
        };

        this.schema = {
            fields: {
                search: [],
                status: [],
                involvement: [],
            },
        };

        this.projectOptionsRequest = new ProjectOptionsRequest({
            setState: d => this.setState(d),
            setProjectOptions: this.props.setDiscoverProjectProjectOptions,
        });
    }

    componentDidMount() {
        this.projectOptionsRequest.init();
        this.projectOptionsRequest.start();
    }

    componentWillReceiveProps(nextProps) {
        const { filters } = nextProps;
        if (this.props.filters !== filters) {
            this.setState({
                faramValues: filters,
                pristine: true,
            });
        }
    }

    componentWillUnmount() {
        this.projectOptionsRequest.stop();
    }

    // UI

    handleFaramChange = (values) => {
        this.setState(
            {
                faramValues: values,
                pristine: false,
            },
            () => {
                if (this.props.applyOnChange) {
                    this.faramComponent.submit();
                }
            },
        );
    }

    handleFaramValidationSuccess = (values) => {
        this.props.setDiscoverProjectFilter(values);
    }

    handleClearFilters = () => {
        if (isObjectEmpty(this.props.filters)) {
            // NOTE: Only clear component state,
            // as the filters in global state is already empty
            this.setState({ faramValues: {}, pristine: true });
        } else {
            this.props.unsetDiscoverProjectFilter();
        }
    }

    render() {
        const {
            className,
            filters,
            applyOnChange,
            projectOptions,
        } = this.props;

        const {
            faramValues,
            pristine,
            pendingProjectOptionss,
        } = this.state;

        const isApplyDisabled = pristine;

        const isFilterEmpty = isObjectEmpty(filters);
        const isClearDisabled = isFilterEmpty && pristine;

        return (
            <Faram
                ref={(elem) => { this.faramComponent = elem; }}
                className={`projects-filters ${className}`}
                onValidationSuccess={this.handleFaramValidationSuccess}
                onChange={this.handleFaramChange}
                schema={this.schema}
                value={faramValues}
                disabled={pendingProjectOptionss}
            >
                <SearchInput
                    faramElementName="search"
                    label={_ts('discoverProjects.filter', 'placeholderSearch')}
                    placeholder={_ts('discoverProjects.filter', 'placeholderSearch')}
                    showHintAndError={false}
                    showLabel
                    className="projects-filter"
                />
                <SelectInput
                    faramElementName="involvement"
                    keySelector={FilterProjectsForm.optionKeySelector}
                    labelSelector={FilterProjectsForm.optionLabelSelector}
                    label={_ts('discoverProjects.filter', 'projects')}
                    options={projectOptions.involvement}
                    placeholder={_ts('discoverProjects.filter', 'placeholderAny')}
                    showHintAndError={false}
                    showLabel
                    className="projects-filter"
                />
                <MultiSelectInput
                    faramElementName="status"
                    keySelector={FilterProjectsForm.optionKeySelector}
                    labelSelector={FilterProjectsForm.optionLabelSelector}
                    label={_ts('discoverProjects.filter', 'status')}
                    options={projectOptions.status}
                    placeholder={_ts('discoverProjects.filter', 'placeholderAny')}
                    showHintAndError={false}
                    showLabel
                    className="projects-filter"
                />
                { !applyOnChange &&
                    <Button
                        className="button apply-filter-button"
                        disabled={isApplyDisabled || pendingProjectOptionss}
                        type="submit"
                    >
                        {_ts('discoverProjects.filter', 'filterApplyFilter')}
                    </Button>
                }
                <DangerButton
                    className="button clear-filter-button"
                    disabled={isClearDisabled || pendingProjectOptionss}
                    onClick={this.handleClearFilters}
                >
                    {_ts('discoverProjects.filter', 'filterClearFilter')}
                </DangerButton>
            </Faram>
        );
    }
}