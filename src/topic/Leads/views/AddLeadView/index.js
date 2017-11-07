import CSSModules from 'react-css-modules';
import React from 'react';
import PropTypes from 'prop-types';
import Helmet from 'react-helmet';
import { connect } from 'react-redux';
import { Tabs, TabContent } from 'react-tabs-redux';

import {
    TransparentButton,
} from '../../../../public/components/Action';

import {
    FileInput,
} from '../../../../public/components/Input';

import AddLeadForm from '../../components/AddLeadForm';
import AddLeadListItem from '../../components/AddLeadListItem';
import { pageTitles } from '../../../../common/utils/labels';
import styles from './styles.scss';
import Uploader, { UploadCoordinator } from '../../../../public/utils/Uploader';
import { tokenSelector } from '../../../../common/selectors/auth';
import { setNavbarStateAction } from '../../../../common/action-creators/navbar';
import update from '../../../../public/utils/immutable-update';
import {
    RestBuilder,
} from '../../../../public/utils/rest';
import {
    urlForUpload,
    createHeaderForFileUpload,
    urlForLeadCreate,
    createParamsForLeadCreate,
} from '../../../../common/rest';

import {
    activeProjectSelector,
} from '../../../../common/selectors/domainData';

const mapStateToProps = state => ({
    activeProject: activeProjectSelector(state),
    token: tokenSelector(state),
    state,
});

const mapDispatchToProps = dispatch => ({
    setNavbarState: params => dispatch(setNavbarStateAction(params)),
});

const propTypes = {
    activeProject: PropTypes.number.isRequired,
    setNavbarState: PropTypes.func.isRequired,
    token: PropTypes.shape({
        access: PropTypes.string,
    }).isRequired,
};

@connect(mapStateToProps, mapDispatchToProps)
@CSSModules(styles, { allowMultiple: true })
export default class AddLead extends React.PureComponent {
    static propTypes = propTypes;

    constructor(props) {
        super(props);
        this.state = {
            leads: [],
            counter: 1,
            activeLeadId: undefined,
        };

        this.uploadCoordinator = new UploadCoordinator();
    }

    componentWillMount() {
        this.props.setNavbarState({
            visible: true,
            activeLink: undefined,
            validLinks: [
                pageTitles.leads,
                pageTitles.entries,
                pageTitles.ary,
                pageTitles.weeklySnapshot,
                pageTitles.export,

                pageTitles.userProfile,
                pageTitles.adminPanel,
                pageTitles.countryPanel,
            ],
        });
    }

    onFocus = (overrideName) => {
        this.form.onFocus(overrideName);
    }

    onChange = (value) => {
        this.form.onChange(value);
    }

    onSubmit = () => {
        this.form.onSubmit();
    }

    leadsClickHandler = (id) => {
        this.setState({ activeLeadId: id });
    }

    handleSubmit = (e) => {
        e.preventDefault();
        this.onSubmit();
        return false;
    }

    handleAddLeadFromDrive = () => {
    }

    handleAddLeadFromDropbox = () => {
    }

    handleUploadComplete = (uploaderId, leadId, status, response) => {
        const { leads } = this.state;
        const leadIndex = leads.findIndex(d => d.id === leadId);
        const r = JSON.parse(response);

        if (parseInt(status / 100, 10) === 2) {
            // success (eg: 200, 201)
            const settings = {
                [leadIndex]: {
                    upload: {
                        $merge: {
                            progress: 100,
                            serverId: r.id,
                            title: r.title,
                            error: undefined,
                        },
                    },
                    form: {
                        error: { $set: false },
                    },
                },
            };
            const newLeads = update(leads, settings);
            this.setState({
                leads: newLeads,
            });
        } else {
            const settings = {
                [leadIndex]: {
                    upload: {
                        $merge: {
                            progress: 0,
                            error: `Failed to upload file (${status})`,
                        },
                    },
                    form: {
                        error: { $set: true },
                    },
                },
            };

            const newLeads = update(leads, settings);
            this.setState({
                leads: newLeads,
            });
        }
    }

    handleLeadUploadProgress = (leadId, progress) => {
        const { leads } = this.state;
        const leadIndex = leads.findIndex(d => d.id === leadId);
        const settings = {
            [leadIndex]: {
                upload: {
                    progress: {
                        $set: progress,
                    },
                },
            },
        };
        const newLeads = update(leads, settings);
        this.setState({
            leads: newLeads,
        });
    }

    handleAddLeadFromDisk = (e) => {
        const newLeads = [];

        const files = Object.values(e);

        for (let i = 0; i < files.length; i += 1) {
            const leadId = `lead-${this.state.counter + i}`;

            const lead = {
                id: leadId,
                type: 'file',
                form: {
                    pending: false,
                    stale: false,
                },
                upload: {
                    progress: 0,
                },
                formData: {
                    title: files[i].name,
                    project: this.props.activeProject,
                },
            };

            newLeads.push(lead);

            const uploader = new Uploader(
                files[i],
                urlForUpload,
                createHeaderForFileUpload(this.props.token),
            );

            uploader.onLoad = (status, response) => {
                this.handleUploadComplete(leadId, leadId, status, response);
            };

            uploader.onProgress = (progress) => {
                this.handleLeadUploadProgress(leadId, progress);
            };

            this.uploadCoordinator.add(leadId, uploader);
        }

        this.uploadCoordinator.queueAll();

        this.setState({
            leads: [
                ...this.state.leads,
                ...newLeads,
            ],
            activeLeadId: `lead-${this.state.counter}`,
            counter: this.state.counter + files.length,
        });
    }

    handleAddLeadFromWebsite = () => {
        this.setState({
            leads: [
                ...this.state.leads,
                {
                    id: `lead-${this.state.counter}`,
                    type: 'website',
                    form: {
                        pending: false,
                        stale: false,
                    },
                    formData: {
                        title: `Lead #${this.state.counter}`,
                        project: this.props.activeProject,
                    },
                },
            ],
            activeLeadId: `lead-${this.state.counter}`,
            counter: this.state.counter + 1,
        });
    }

    handleAddLeadFromText = () => {
        this.setState({
            leads: [
                ...this.state.leads,
                {
                    id: `lead-${this.state.counter}`,
                    type: 'text',
                    form: {
                        pending: false,
                        stale: false,
                    },
                    formData: {
                        title: `Lead #${this.state.counter}`,
                        project: this.props.activeProject,
                    },
                },
            ],
            activeLeadId: `lead-${this.state.counter}`,
            counter: this.state.counter + 1,
        });
    }

    handleOptionChange = (changeEvent) => {
        this.setState({
            selectedValue: changeEvent.target.value,
        });
    };

    isLeadReady = (lead) => {
        if (lead.type === 'file') {
            return lead.upload.progress >= 100;
        }
        return true;
    }

    handleLeadChange = (leadId, values) => {
        const { leads } = this.state;
        const leadIndex = leads.findIndex(d => d.id === leadId);
        const settings = {
            [leadIndex]: {
                form: {
                    stale: { $set: true },
                    error: { $set: false },
                },
                formData: { $merge: values },
            },
        };
        const newLeads = update(leads, settings);
        this.setState({
            leads: newLeads,
        });
    }

    handleLeadSuccess = (leadId, values) => {
        const { leads } = this.state;
        const leadIndex = leads.findIndex(d => d.id === leadId);
        const settings = {
            [leadIndex]: {
                form: {
                    stale: { $set: false },
                    pending: { $set: true },
                },
                formData: { $set: values },
            },
        };
        const newLeads = update(leads, settings);
        this.setState({
            leads: newLeads,
        });


        if (this.leadCreateRequest) {
            this.leadCreateRequest.stop();
        }

        this.leadCreateRequest = this.createLeadCreateRequest(urlForLeadCreate, () => {
            const { access } = this.props.token;
            return createParamsForLeadCreate({ access }, values);
        });

        this.leadCreateRequest.start();
    }

    createLeadCreateRequest = (url, params) => {
        const leadCreateRequest = new RestBuilder()
            .url(url)
            .params(params)
            .decay(0.3)
            .maxRetryTime(2000)
            .maxRetryAttempts(10)
            .success((response) => {
                try {
                    console.log(response);
                } catch (err) {
                    console.error(err);
                }
            })
            .failure((response) => {
                console.info('FAILURE:', response);
                const { errors } = response;
                const formFieldErrors = {};
                const { nonFieldErrors } = errors;

                Object.keys(errors).forEach((key) => {
                    if (key !== 'nonFieldErrors') {
                        formFieldErrors[key] = errors[key].join(' ');
                    }
                });

                this.setState({
                    formFieldErrors,
                    formErrors: nonFieldErrors,
                    pending: false,
                });
            })
            .fatal((response) => {
                console.info('FATAL:', response);
                this.setState({ pending: false });
            })
            .build();
        return leadCreateRequest;
    }

    handleLeadFailure = (leadId) => {
        const { leads } = this.state;
        const leadIndex = leads.findIndex(d => d.id === leadId);
        const settings = {
            [leadIndex]: {
                form: {
                    stale: { $set: false },
                    error: { $set: true },
                },
            },
        };
        const newLeads = update(leads, settings);
        this.setState({
            leads: newLeads,
        });
    }

    render() {
        return (
            <div styleName="add-lead">
                <Helmet>
                    <title>
                        { pageTitles.addLeads }
                    </title>
                </Helmet>
                <Tabs
                    selectedTab={this.state.activeLeadId}
                    activeLinkStyle={{ none: 'none' }}
                    styleName="tab-container"
                >
                    <div styleName="lead-list-container">
                        <h2 styleName="heading">
                            Leads
                        </h2>
                        <div styleName="list">
                            {
                                this.state.leads.map(lead => (
                                    <AddLeadListItem
                                        active={this.state.activeLeadId === lead.id}
                                        key={lead.id}
                                        onClick={() => this.leadsClickHandler(lead.id)}
                                        stale={lead.form.stale}
                                        error={lead.form.error}
                                        title={lead.formData.title}
                                        type={lead.type}
                                        upload={lead.upload}
                                    />
                                ))
                            }
                        </div>
                        <div styleName="add-lead-container">
                            <h3 styleName="heading">
                                Add new lead from:
                            </h3>
                            <TransparentButton
                                styleName="add-lead-btn"
                                onClick={this.handleAddLeadFromDrive}
                            >
                                <span className="ion-social-google" />
                                <p>Drive</p>
                            </TransparentButton>
                            <TransparentButton
                                styleName="add-lead-btn"
                                onClick={this.handleAddLeadFromDropbox}
                            >
                                <span className="ion-social-dropbox" />
                                <p>Dropbox</p>
                            </TransparentButton>
                            <FileInput
                                styleName="add-lead-btn"
                                onChange={this.handleAddLeadFromDisk}
                                showStatus={false}
                                multiple
                            >
                                <span className="ion-android-upload" />
                                <p>Local disk</p>
                            </FileInput>
                            <TransparentButton
                                styleName="add-lead-btn"
                                onClick={this.handleAddLeadFromWebsite}
                            >
                                <span className="ion-earth" />
                                <p>Website</p>
                            </TransparentButton>
                            <TransparentButton
                                styleName="add-lead-btn"
                                onClick={this.handleAddLeadFromText}
                            >
                                <span className="ion-clipboard" />
                                <p>Text</p>
                            </TransparentButton>
                        </div>
                    </div>
                    <div styleName="lead-detail-container">
                        {
                            this.state.leads.map(lead => (
                                <TabContent
                                    for={lead.id}
                                    key={lead.id}
                                    styleName="tab"
                                >
                                    <AddLeadForm
                                        leadId={lead.id}
                                        leadType={lead.type}
                                        ready={this.isLeadReady(lead)}
                                        pending={lead.form.pending}
                                        stale={lead.form.stale}
                                        formValues={lead.formData}
                                        uploadData={lead.upload}
                                        onChange={this.handleLeadChange}
                                        onSuccess={this.handleLeadSuccess}
                                        onFailure={this.handleLeadFailure}
                                        styleName="add-lead-form"
                                    />
                                    <div styleName="lead-preview">
                                        Lead preview
                                    </div>
                                </TabContent>
                            ))
                        }
                    </div>
                </Tabs>
            </div>
        );
    }
}
