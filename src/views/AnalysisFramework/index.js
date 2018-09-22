import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { Link, Prompt } from 'react-router-dom';

import BoundError from '#rscg/BoundError';
import LoadingAnimation from '#rscv/LoadingAnimation';
import MultiViewContainer from '#rscv/MultiViewContainer';
import { reverseRoute } from '#rsu/common';
import SuccessButton from '#rsca/Button/SuccessButton';
import SuccessConfirmButton from '#rsca/ConfirmButton/SuccessConfirmButton';
import DangerConfirmButton from '#rsca/ConfirmButton/DangerConfirmButton';
import FixedTabs from '#rscv/FixedTabs';
import Message from '#rscv/Message';

import { detachedFaram, requiredCondition } from '#rscg/Faram';

import { VIEW } from '#widgets';
import AppError from '#components/AppError';
import {
    afIdFromRoute,
    setAfViewAnalysisFrameworkAction,

    afViewAnalysisFrameworkSelector,
    afViewPristineSelector,
    activeProjectIdFromStateSelector,

    afViewFaramValuesSelector,
    afViewFaramErrorsSelector,
    setAfViewFaramAction,

    routeUrlSelector,
} from '#redux';
import {
    iconNames,
    pathNames,
} from '#constants';
import _ts from '#ts';

import FrameworkGetRequest from './requests/FrameworkGet';
import FrameworkSaveRequest from './requests/FrameworkSave';
import Overview from './Overview';
import List from './List';
import styles from './styles.scss';

const propTypes = {
    analysisFramework: PropTypes.object, // eslint-disable-line react/forbid-prop-types
    analysisFrameworkId: PropTypes.number.isRequired,
    setAnalysisFramework: PropTypes.func.isRequired,
    projectId: PropTypes.number.isRequired,
    pristine: PropTypes.bool.isRequired,

    routeUrl: PropTypes.string.isRequired,
    faramValues: PropTypes.object, // eslint-disable-line react/forbid-prop-types
    faramErrors: PropTypes.object, // eslint-disable-line react/forbid-prop-types
    setFaram: PropTypes.func.isRequired,
};

const defaultProps = {
    analysisFramework: undefined,
    faramValues: {},
    faramErrors: {},
};

const mapStateToProps = (state, props) => ({
    analysisFramework: afViewAnalysisFrameworkSelector(state, props),
    pristine: afViewPristineSelector(state, props),
    analysisFrameworkId: afIdFromRoute(state, props),
    projectId: activeProjectIdFromStateSelector(state, props),
    routeUrl: routeUrlSelector(state),
    faramValues: afViewFaramValuesSelector(state),
    faramErrors: afViewFaramErrorsSelector(state),
});

const mapDispatchToProps = dispatch => ({
    setAnalysisFramework: params => dispatch(setAfViewAnalysisFrameworkAction(params)),
    setFaram: params => dispatch(setAfViewFaramAction(params)),
});

@BoundError(AppError)
@connect(mapStateToProps, mapDispatchToProps)
export default class AnalysisFramework extends React.PureComponent {
    static propTypes = propTypes;
    static defaultProps = defaultProps;

    static schema = {
        fields: {
            title: [requiredCondition],
            description: [],
        },
    }

    constructor(props) {
        super(props);

        this.state = {
            pendingFramework: true,
            pendingSaveFramework: false,
        };

        this.frameworkGetRequest = new FrameworkGetRequest({
            setState: params => this.setState(params),
            setAnalysisFramework: this.props.setAnalysisFramework,
            getAnalysisFramework: () => this.props.analysisFramework,
        });

        this.frameworkSaveRequest = new FrameworkSaveRequest({
            setState: params => this.setState(params),
            setAnalysisFramework: this.props.setAnalysisFramework,
        });

        this.views = {
            [VIEW.overview]: {
                component: Overview,
                rendererParams: () => ({
                    analysisFramework: this.props.analysisFramework,

                    pending: this.state.pendingSaveFramework,
                    onChange: this.handleFaramChange,
                    faramSchema: AnalysisFramework.schema,
                    faramValues: this.props.faramValues,
                    faramErrors: this.props.faramErrors,
                }),
                wrapContainer: true,
                mount: true,
            },
            [VIEW.list]: {
                component: List,
                rendererParams: () => ({
                    analysisFramework: this.props.analysisFramework,
                }),
                wrapContainer: true,
                mount: true,
            },
        };

        this.tabs = {
            [VIEW.overview]: _ts('framework', 'overviewTabTitle'),
            [VIEW.list]: _ts('framework', 'listTabTitle'),
        };

        this.defaultHash = VIEW.overview;
    }

    componentWillMount() {
        this.frameworkGetRequest.init(this.props.analysisFrameworkId);
        this.frameworkGetRequest.start();
    }

    componentWillReceiveProps(nextProps) {
        const { analysisFrameworkId: oldAnalysisFrameworkId } = this.props;
        const { analysisFrameworkId: newAnalysisFrameworkId } = nextProps;

        if (oldAnalysisFrameworkId !== newAnalysisFrameworkId) {
            if (this.analysisFrameworkSaveRequest) {
                this.analysisFrameworkSaveRequest.stop();
            }

            this.frameworkGetRequest.init(newAnalysisFrameworkId);
            this.frameworkGetRequest.start();
        }
    }

    componentWillUnmount() {
        this.frameworkGetRequest.stop();
        this.frameworkSaveRequest.stop();
    }

    handleFaramChange = (faramValues = this.props.faramValues, faramErrors) => {
        const { analysisFrameworkId } = this.props;
        this.props.setFaram({
            faramValues,
            faramErrors,
            analysisFrameworkId,
        });
    }

    handleSave = () => {
        const {
            analysisFrameworkId,
            analysisFramework,
            faramValues,
        } = this.props;

        detachedFaram({
            value: faramValues,
            schema: AnalysisFramework.schema,
            onValidationFailure: (errors) => {
                this.handleFaramChange(undefined, errors);
            },
            onValidationSuccess: (values) => {
                const afValues = {
                    ...analysisFramework,
                    ...values,
                };
                this.frameworkSaveRequest.init(analysisFrameworkId, afValues);
                this.frameworkSaveRequest.start();
            },
        });
    }

    handleCancel = () => {
        // The second signifies cancel operation
        this.frameworkGetRequest.init(this.props.analysisFrameworkId, true);
        this.frameworkGetRequest.start();
    }

    render() {
        const {
            analysisFramework = {},
            projectId,
            pristine,
        } = this.props;
        const { entriesCount } = analysisFramework;

        const { pendingFramework, pendingSaveFramework } = this.state;

        if (pendingFramework) {
            return (
                <div className={styles.analysisFramework}>
                    <LoadingAnimation large />
                </div>
            );
        }

        if (!analysisFramework.id) {
            return (
                <Message className={styles.analysisFramework}>
                    {_ts('framework', 'noAnalysisFramework')}
                </Message>
            );
        }

        const exitPath = reverseRoute(pathNames.projects, { projectId });
        const frameworkTitle = analysisFramework.title || _ts('framework', 'analysisFramework');

        return (
            <div className={styles.analysisFramework}>
                <Prompt
                    message={
                        (location) => {
                            const { routeUrl } = this.props;
                            if (location.pathname === routeUrl) {
                                return true;
                            } else if (pristine) {
                                return true;
                            }
                            return _ts('common', 'youHaveUnsavedChanges');
                        }
                    }
                />
                <header className={styles.header}>
                    <Link
                        className={styles.backLink}
                        title={_ts('framework', 'backButtonTooltip')}
                        to={{
                            pathname: exitPath,
                            hash: '#/frameworks',
                        }}
                    >
                        <i className={iconNames.back} />
                    </Link>
                    <h4 className={styles.heading}>
                        { frameworkTitle }
                    </h4>
                    <FixedTabs
                        className={styles.tabs}
                        tabs={this.tabs}
                        useHash
                        replaceHistory
                        defaultHash={this.defaultHash}
                    />
                    <div className={styles.actionButtons}>
                        <DangerConfirmButton
                            confirmationMessage={_ts('framework', 'cancelConfirmDetail')}
                            onClick={this.handleCancel}
                            disabled={pristine}
                        >
                            { _ts('framework', 'cancelButtonTitle') }
                        </DangerConfirmButton>
                        {
                            entriesCount > 0 ? (
                                <SuccessConfirmButton
                                    confirmationMessage={_ts('framework', 'successConfirmDetail', { count: entriesCount })}
                                    onClick={this.handleSave}
                                    disabled={pristine || pendingSaveFramework}
                                >
                                    { _ts('framework', 'saveButtonTitle') }
                                </SuccessConfirmButton>
                            ) : (
                                <SuccessButton
                                    onClick={this.handleSave}
                                    disabled={pristine || pendingSaveFramework}
                                >
                                    { _ts('framework', 'saveButtonTitle') }
                                </SuccessButton>
                            )
                        }
                    </div>
                </header>
                <MultiViewContainer
                    views={this.views}
                    useHash
                    containerClassName={styles.content}
                    activeClassName={styles.active}
                />
            </div>
        );
    }
}
