import CSSModules from 'react-css-modules';
import PropTypes from 'prop-types';
import React from 'react';
import {
    Table,
} from '../../../../public/components/View';
import {
    TextInput,
} from '../../../../public/components/Input';
import {
    PrimaryButton,
    TransparentAccentButton,
    TransparentButton,
} from '../../../../public/components/Action';
import styles from './styles.scss';

const propTypes = {

};

const defaultProps = {
};

@CSSModules(styles, { allowMultiple: true })
export default class ProjectsTable extends React.PureComponent {
    static propTypes = propTypes;
    static defaultProps = defaultProps;

    constructor(props) {
        super(props);

        this.projectHeaders = [
            {
                key: 'title',
                label: 'Title',
                order: 1,
            },
            {
                key: 'createdAt',
                label: 'Created at',
                order: 2,
            },
            {
                key: 'startDate',
                label: 'Start Date',
                order: 3,
            },
            {
                key: 'countries',
                label: 'Countries',
                order: 4,
            },
            {
                key: 'status',
                label: 'Status',
                order: 5,
                modifier: () => 'Active', // NOTE: Show 'Active' for now
            },
            {
                key: 'modifiedAt',
                label: 'Last Modified at',
                order: 6,
            },
            {
                key: 'members',
                label: 'Members',
                order: 7,
            },
            {
                key: 'actions',
                label: 'Actions',
                order: 8,
                modifier: row => (
                    <div className="actions">
                        <TransparentButton
                            title="Remove Member"
                            onClick={() => this.handleRemoveProjectClick(row)}

                        >
                            <i className="ion-ios-trash" />
                        </TransparentButton>
                        <TransparentButton >
                            <i className="ion-ios-locked" />
                        </TransparentButton>
                        <TransparentAccentButton >
                            <i className="ion-forward" />
                        </TransparentAccentButton>
                    </div>
                ),
            },
        ];
        this.projectData = [
            {
                title: 'Nepal Monitoring',
                createdAt: '2010-04-05',
                startDate: 'jacky@jacky.com',
                countries: 'Nepal',
                status: 'Jacky',
                modifiedAt: 'Super Admin',
                members: 22,
            },
        ];
    }

    handleRemoveProjectClick = (row) => {
        console.log(row);
    };
    render() {
        return (
            <div>
                <div styleName="projects-table">
                    <div styleName="header">
                        <TextInput
                            placeholder="Search Projects"
                            type="search"
                            styleName="search-input"
                        />
                    </div>
                    <div styleName="content">
                        <Table
                            data={this.projectData}
                            headers={this.projectHeaders}
                            keyExtractor={rowData => rowData.id}
                        />
                    </div>
                </div>
            </div>
        );
    }
}
