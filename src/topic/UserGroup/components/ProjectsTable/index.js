import CSSModules from 'react-css-modules';
import PropTypes from 'prop-types';
import React from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import {
    Confirm,
    Table,
    Modal,
    ModalHeader,
    ModalBody,
    FormattedDate,
    LoadingAnimation,
} from '../../../../public/components/View';
import {
    TextInput,
} from '../../../../public/components/Input';
import {
    PrimaryButton,
    DangerButton,
} from '../../../../public/components/Action';
import { FgRestBuilder } from '../../../../public/utils/rest';
import {
    reverseRoute,
    caseInsensitiveSubmatch,
} from '../../../../public/utils/common';

import {
    iconNames,
    notificationStrings,
    pathNames,
    userStrings,
} from '../../../../common/constants';
import {
    userGroupProjectSelector,
    setUserProjectsAction,
    unSetProjectAction,
    activeUserSelector,
} from '../../../../common/redux';
import {
    createUrlForUserGroupProjects,
    createParamsForUser,
    createParamsForProjectDelete,
    createUrlForProject,
} from '../../../../common/rest';

import schema from '../../../../common/schema';
import notify from '../../../../common/notify';

import UserProjectAdd from '../../../../common/components/UserProjectAdd';
import styles from './styles.scss';

const propTypes = {
    className: PropTypes.string,
    userGroup: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
    projects: PropTypes.array.isRequired, // eslint-disable-line react/forbid-prop-types
    setUserGroupProject: PropTypes.func.isRequired, // eslint-disable-line react/forbid-prop-types
    unSetProject: PropTypes.func.isRequired, // eslint-disable-line react/forbid-prop-types
    activeUser: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
    isCurrentUserAdmin: PropTypes.bool.isRequired,
};

const defaultProps = {
    className: '',
};

const mapStateToProps = (state, props) => ({
    projects: userGroupProjectSelector(state, props),
    activeUser: activeUserSelector(state),
});

const mapDispatchToProps = dispatch => ({
    setUserGroupProject: params => dispatch(setUserProjectsAction(params)),
    unSetProject: params => dispatch(unSetProjectAction(params)),
});

@connect(mapStateToProps, mapDispatchToProps)
@CSSModules(styles, { allowMultiple: true })
export default class ProjectsTable extends React.PureComponent {
    static propTypes = propTypes;
    static defaultProps = defaultProps;

    constructor(props) {
        super(props);

        this.state = {
            showAddProjectModal: false,
            showDeleteProjectModal: false,
            confirmText: '',
            deletePending: false,
            selectedProject: {},
            searchProjectInputValue: '',
            projects: this.props.projects,
        };

        this.projectHeaders = [
            {
                key: 'title',
                label: userStrings.tableHeaderTitle,
                order: 1,
                sortable: true,
                comparator: (a, b) => a.title.localeCompare(b.title),
            },
            {
                key: 'createdAt',
                label: userStrings.tableHeaderCreatedAt,
                order: 2,
                modifier: row => <FormattedDate date={row.createdAt} mode="dd-MM-yyyy hh:mm" />,
            },
            {
                key: 'startDate',
                label: userStrings.tableHeaderStartDate,
                order: 3,
                modifier: row => <FormattedDate date={row.startDate} mode="dd-MM-yyyy hh:mm" />,
            },
            {
                key: 'countries',
                label: userStrings.tableHeaderStartDate,
                order: 4,
                sortable: true,
                modifier: d => ((d.regions || []).length),
                comparator: (a, b) => (a.regions || []).length - (b.regions || []).length,
            },
            {
                key: 'status',
                label: userStrings.tableHeaderStatus,
                order: 5,
                modifier: () => 'Active', // NOTE: Show 'Active' for now
                // sortable: true,
                // comparator: (a, b) => a.name.localeCompare(b.name),
            },
            {
                key: 'modifiedAt',
                label: userStrings.tableHeaderLastModifiedAt,
                order: 6,
                modifier: row => <FormattedDate date={row.modifiedAt} mode="dd-MM-yyyy hh:mm" />,
            },
            {
                key: 'members',
                label: userStrings.tableHeaderMembers,
                order: 7,
                sortable: true,
                modifier: d => ((d.memberships || []).length),
                comparator: (a, b) => (a.memberships || []).length - (b.memberships || []).length,
            },
            {
                key: 'actions',
                label: userStrings.tableHeaderActions,
                order: 8,
                modifier: row => (
                    <div>
                        {
                            this.props.isCurrentUserAdmin &&
                            <DangerButton
                                title={userStrings.deleteProjectLinkTitle}
                                onClick={() => this.handleDeleteProjectClick(row)}
                                iconName={iconNames.delete}
                                smallVerticalPadding
                                transparent
                            />
                        }
                        <Link
                            title={userStrings.viewProjectLinkTitle}
                            key={row.id}
                            to={reverseRoute(pathNames.projects, { projectId: row.id })}
                            className={styles.link}
                        >
                            <span className={iconNames.openLink} />
                        </Link>
                    </div>
                ),
            },
        ];
    }

    componentWillMount() {
        this.requestForUserGroupProjects = this.createRequestForUserGroupProjects(
            this.props.userGroup.id,
        );
        this.requestForUserGroupProjects.start();
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            projects: nextProps.projects,
        });
    }

    componentWillUnmount() {
        if (this.requestForUserGroupProjects) {
            this.requestForUserGroupProjects.stop();
        }
    }

    createRequestForUserGroupProjects = (id) => {
        const urlForUserGroupProjects = createUrlForUserGroupProjects(id);
        const userGroupRequest = new FgRestBuilder()
            .url(urlForUserGroupProjects)
            .params(() => createParamsForUser())
            .success((response) => {
                try {
                    schema.validate(response, 'projectsGetResponse');
                    this.props.setUserGroupProject({
                        projects: response.results,
                    });
                } catch (er) {
                    console.error(er);
                }
            })
            .failure((response) => {
                console.info('FAILURE:', response);
            })
            .fatal((response) => {
                console.info('FATAL:', response);
            })
            .build();
        return userGroupRequest;
    }

    createRequestForProjectDelete = (projectId) => {
        const urlForProject = createUrlForProject(projectId);

        const projectDeleteRequest = new FgRestBuilder()
            .url(urlForProject)
            .params(() => createParamsForProjectDelete())
            .preLoad(() => {
                this.setState({ deletePending: true });
            })
            .postLoad(() => {
                this.setState({ deletePending: false });
            })
            .success(() => {
                // FIXME: write schema
                try {
                    this.props.unSetProject({
                        projectId,
                        userId: this.props.activeUser.userId,
                    });
                    notify.send({
                        title: notificationStrings.userProjectDelete,
                        type: notify.type.SUCCESS,
                        message: notificationStrings.userProjectDeleteSuccess,
                        duration: notify.duration.MEDIUM,
                    });
                    this.setState({ showDeleteProjectModal: false });
                } catch (er) {
                    console.error(er);
                }
            })
            .failure(() => {
                notify.send({
                    title: notificationStrings.userProjectDelete,
                    type: notify.type.ERROR,
                    message: notificationStrings.userProjectDeleteFailure,
                    duration: notify.duration.MEDIUM,
                });
            })
            .fatal((response) => {
                console.info('FATAL:', response);
            })
            .build();
        return projectDeleteRequest;
    }

    handleDeleteProjectClick = (project) => {
        const confirmText = `${userStrings.confirmTextDeleteProject}
        ${project.title}?`;

        this.setState({
            showDeleteProjectModal: true,
            selectedProject: project,
            confirmText,
        });
    };

    handleDeleteProjectClose = (confirm) => {
        if (confirm) {
            if (this.projectDeleteRequest) {
                this.projectDeleteRequest.stop();
            }

            const { selectedProject } = this.state;
            this.projectDeleteRequest = this.createRequestForProjectDelete(
                selectedProject.id,
            );
            this.projectDeleteRequest.start();
        }
        this.setState({ showDeleteProjectModal: false });
    }

    handleAddProjectClick = () => {
        this.setState({ showAddProjectModal: true });
    }

    handleAddProjectModalClose = () => {
        this.setState({ showAddProjectModal: false });
    }

    handleSearchProjectChange = (value) => {
        const { projects } = this.props;
        const newProjects = projects.filter(
            project => caseInsensitiveSubmatch(project.title, value),
        );
        this.setState({
            searchProjectInputValue: value,
            projects: newProjects,
        });
    }

    keyExtractor = rowData => rowData.id

    render() {
        const { userGroup } = this.props;

        const {
            deletePending,
            showAddProjectModal,
            showDeleteProjectModal,
            projects,
            searchProjectInputValue,
            confirmText,
        } = this.state;

        return (
            <div
                className={this.props.className}
                styleName="projects"
            >
                {deletePending && <LoadingAnimation /> }
                <div styleName="header">
                    <h2>
                        {userStrings.headerProjects}
                    </h2>
                    <div styleName="pusher" />
                    <TextInput
                        placeholder={userStrings.placeholderSearch}
                        onChange={this.handleSearchProjectChange}
                        value={searchProjectInputValue}
                        type="search"
                        styleName="search-input"
                        showLabel={false}
                        showHintAndError={false}
                    />
                    {
                        this.props.isCurrentUserAdmin &&
                        <PrimaryButton
                            onClick={this.handleAddProjectClick}
                            title={userStrings.addProjectButtonLabel}
                        >
                            {userStrings.addProjectButtonLabel}
                        </PrimaryButton>
                    }
                </div>
                <div styleName="content">
                    <Table
                        data={projects}
                        headers={this.projectHeaders}
                        keyExtractor={this.keyExtractor}
                    />
                </div>
                { showAddProjectModal &&
                    <Modal
                        closeOnEscape
                        onClose={this.handleAddProjectModalClose}
                    >
                        <ModalHeader
                            title={userStrings.addProjectButtonLabel}
                            rightComponent={
                                <PrimaryButton
                                    onClick={this.handleAddProjectModalClose}
                                    transparent
                                >
                                    <span className={iconNames.close} />
                                </PrimaryButton>
                            }
                        />
                        <ModalBody>
                            <UserProjectAdd
                                // TODO: fix this please
                                userGroups={[userGroup]}
                                handleModalClose={this.handleAddProjectModalClose}
                            />
                        </ModalBody>
                    </Modal>
                }
                <Confirm
                    onClose={this.handleDeleteProjectClose}
                    show={showDeleteProjectModal}
                >
                    <p>{confirmText}</p>
                </Confirm>
            </div>
        );
    }
}
