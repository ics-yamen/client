import CSSModules from 'react-css-modules';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import {
    Redirect,
    Route,
    HashRouter,
} from 'react-router-dom';

import schema from '../../../../common/schema';
import { FgRestBuilder } from '../../../../public/utils/rest';
import { CoordinatorBuilder } from '../../../../public/utils/coordinate';

import {
    LoadingAnimation,
} from '../../../../public/components/View';

import {
    leadIdFromRoute,
    /*
    editEntryViewCurrentLeadSelector,
    editEntryViewCurrentProjectSelector,
    */
    editEntryViewCurrentAnalysisFrameworkSelector,
    editEntryViewEntriesSelector,
    editEntryViewSelectedEntryIdSelector,

    setAnalysisFrameworkAction,
    setEditEntryViewLeadAction,
    setProjectAction,

    changeEntryAction,
} from '../../../../common/redux';
import {
    createParamsForUser,
    createUrlForAnalysisFramework,
    createUrlForLead,
    createUrlForProject,

    createParamsForEntryCreate,
    createParamsForEntryEdit,

    createUrlForEntryEdit,
    urlForEntryCreate,
} from '../../../../common/rest';

import styles from './styles.scss';
import Overview from './Overview';
import List from './List';

const propTypes = {
    analysisFramework: PropTypes.object, // eslint-disable-line react/forbid-prop-types
    leadId: PropTypes.string.isRequired,
    /*
    lead: PropTypes.object, // eslint-disable-line react/forbid-prop-types
    project: PropTypes.object, // eslint-disable-line react/forbid-prop-types
    */
    setAnalysisFramework: PropTypes.func.isRequired,
    setLead: PropTypes.func.isRequired,
    setProject: PropTypes.func.isRequired,

    entries: PropTypes.array.isRequired, // eslint-disable-line react/forbid-prop-types

    selectedEntryId: PropTypes.string,

    changeEntry: PropTypes.func.isRequired,
};

const defaultProps = {
    /*
    lead: undefined,
    project: undefined,
    */
    analysisFramework: undefined,
    selectedEntryId: undefined,
};

const mapStateToProps = (state, props) => ({
    leadId: leadIdFromRoute(state, props),

    /*
    lead: editEntryViewCurrentLeadSelector(state, props),
    project: editEntryViewCurrentProjectSelector(state, props),
    */

    entries: editEntryViewEntriesSelector(state, props),
    selectedEntryId: editEntryViewSelectedEntryIdSelector(state, props),
    analysisFramework: editEntryViewCurrentAnalysisFrameworkSelector(state, props),
});

const mapDispatchToProps = dispatch => ({
    changeEntry: params => dispatch(changeEntryAction(params)),

    setAnalysisFramework: params => dispatch(setAnalysisFrameworkAction(params)),
    setLead: params => dispatch(setEditEntryViewLeadAction(params)),
    setProject: params => dispatch(setProjectAction(params)),
});

@connect(mapStateToProps, mapDispatchToProps)
@CSSModules(styles, { allowMultiple: true })
export default class EditEntryView extends React.PureComponent {
    static propTypes = propTypes;
    static defaultProps = defaultProps;

    constructor(props) {
        super(props);

        this.state = {
            entryRests: {
                /*
                1: { pending: true },
                */
            },
            pendingSubmitAll: false,
        };
        this.saveCoordinator = new CoordinatorBuilder()
            .maxActiveActors(3)
            .preSession(() => {
                this.setState({ pendingSubmitAll: true });
            })
            .postSession(() => {
                this.setState({ pendingSubmitAll: false });
            })
            .build();
    }

    componentWillMount() {
        this.leadRequest = this.createRequestForLead(this.props.leadId);
        this.leadRequest.start();
    }

    componentWillUnmount() {
        if (this.leadRequest) {
            this.leadRequest.stop();
        }

        if (this.projectRequest) {
            this.projectRequest.stop();
        }

        if (this.analysisFrameworkRequest) {
            this.analysisFrameworkRequest.stop();
        }

        this.formCoordinator.close();
    }

    createRequestForLead = (leadId) => {
        const leadRequest = new FgRestBuilder()
            .url(createUrlForLead(leadId))
            .params(() => createParamsForUser())
            .success((response) => {
                try {
                    schema.validate(response, 'lead');
                    this.props.setLead({
                        lead: response,
                    });

                    this.projectRequest = this.createRequestForProject(response.project);
                    this.projectRequest.start();
                } catch (er) {
                    console.error(er);
                }
            })
            .build();
        return leadRequest;
    }

    createRequestForProject = (projectId) => {
        const projectRequest = new FgRestBuilder()
            .url(createUrlForProject(projectId))
            .params(() => createParamsForUser())
            .success((response) => {
                try {
                    schema.validate(response, 'projectGetResponse');
                    this.props.setProject({
                        project: response,
                    });

                    this.analysisFramework = this.createRequestForAnalysisFramework(
                        response.analysisFramework,
                    );
                    this.analysisFramework.start();
                } catch (er) {
                    console.error(er);
                }
            })
            .build();
        return projectRequest;
    };

    createRequestForAnalysisFramework = (analysisFrameworkId) => {
        const urlForAnalysisFramework = createUrlForAnalysisFramework(
            analysisFrameworkId,
        );
        const analysisFrameworkRequest = new FgRestBuilder()
            .url(urlForAnalysisFramework)
            .params(() => createParamsForUser())
            .success((response) => {
                try {
                    schema.validate(response, 'analysisFramework');
                    this.props.setAnalysisFramework({
                        analysisFramework: response,
                    });
                } catch (er) {
                    console.error(er);
                }
            })
            .build();
        return analysisFrameworkRequest;
    }

    createRequestForEntrySave = (entryId) => {
        const { leadId } = this.props;
        const entry = this.props.entries.find(
            e => this.entryKeyExtractor(e) === entryId,
        );

        let urlForEntry;
        let paramsForEntry;
        const { serverId } = entry.data;
        if (serverId) {
            console.warn('editing');
            urlForEntry = createUrlForEntryEdit(serverId);
            paramsForEntry = createParamsForEntryEdit(entry.widget.values);
        } else {
            console.warn('creating');
            urlForEntry = urlForEntryCreate;
            paramsForEntry = createParamsForEntryCreate(entry.widget.values);
        }
        console.log(entry.widget.values);

        const analysisFrameworkRequest = new FgRestBuilder()
            .url(urlForEntry)
            .params(paramsForEntry)
            .success((response) => {
                try {
                    schema.validate(response, 'entry');

                    const data = {
                        versionId: response.versionId,
                        serverId: response.id,
                    };
                    this.props.changeEntry({ leadId, entryId, data });
                } catch (er) {
                    console.error(er);
                }

                this.saveCoordinator.notifyComplete(entryId);
            })
            .failure((response) => {
                console.warn('FAILURE:', response);
                this.saveCoordinator.notifyComplete(entryId);
            })
            .fatal((response) => {
                console.warn('FATAL:', response);
                this.saveCoordinator.notifyComplete(entryId);
            })
            .build();

        return analysisFrameworkRequest;
    };

    handleSaveAll = () => {
        const entryKeys = this.props.entries
            .map(this.entryKeyExtractor);
        entryKeys.forEach((id) => {
            const request = this.createRequestForEntrySave(id);
            this.saveCoordinator.add(id, request);
        });
        this.saveCoordinator.start();
    }

    entryKeyExtractor = entry => entry.data.id;

    render() {
        const {
            analysisFramework,
            leadId,
            entries,
            selectedEntryId,
        } = this.props;

        if (!analysisFramework) {
            return (
                <div styleName="edit-entry">
                    <LoadingAnimation />
                </div>
            );
        }

        return (
            <HashRouter>
                <div styleName="edit-entry">
                    <Route
                        exact
                        path="/"
                        component={
                            () => (
                                <Redirect to="/overview" />
                            )
                        }
                    />
                    <Route
                        path="/overview"
                        render={props => (
                            <Overview
                                {...props}
                                leadId={leadId}
                                selectedEntryId={selectedEntryId}
                                entries={entries}
                                analysisFramework={analysisFramework}
                                onSaveAll={this.handleSaveAll}
                                saveAllDisabled={this.state.pendingSubmitAll}
                            />
                        )}
                    />
                    <Route
                        path="/list"
                        render={props => (
                            <List
                                {...props}
                                leadId={leadId}
                                entries={entries}
                                analysisFramework={analysisFramework}
                            />
                        )}
                    />
                </div>
            </HashRouter>
        );
    }
}
