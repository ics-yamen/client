import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { _cs } from '@togglecorp/fujs';

import { projectIdFromRoute } from '#redux';
import Message from '#rscv/Message';

import { RequestCoordinator } from '#request';
import update from '#rsu/immutable-update';
import noSearch from '#resources/img/no-filter.png';
import noItemsIcon from '#resources/img/no-search.png';

import SearchList from './SearchList';
import ProjectUserList from './ProjectUserList';
import ProjectUsergroupList from './ProjectUsergroupList';

import styles from './styles.scss';

const propTypes = {
    projectId: PropTypes.number.isRequired,
    className: PropTypes.string,
    readOnly: PropTypes.bool,
};

const defaultProps = {
    className: '',
    readOnly: false,
};

const mapStateToProps = (state, props) => ({
    projectId: projectIdFromRoute(state, props),
});

const SearchEmpty = () => (
    <Message className={styles.emptySearch}>
        <img
            className={styles.image}
            src={noSearch}
            alt=""
        />
    </Message>
);

const Empty = () => (
    <Message className={styles.emptyList}>
        <img
            className={styles.image}
            src={noItemsIcon}
            alt=""
        />
    </Message>
);

@connect(mapStateToProps)
@RequestCoordinator
export default class Users extends React.PureComponent {
    static propTypes = propTypes;
    static defaultProps = defaultProps;

    state = {
        searchInputValue: '',
        searchItems: [],
    };

    handleSearchInputChange = (searchInputValue) => {
        this.setState({ searchInputValue });
    }

    handleSearchItemsPull = (searchItems = []) => {
        this.setState({ searchItems });
    }

    handleSearchItemRemove = (itemId, type) => {
        const settings = { $autoArray: {
            $filter: i => !(i.id === itemId && i.type === type),
        } };
        const searchItems = update(this.state.searchItems, settings);
        this.setState({ searchItems });
    }

    render() {
        const {
            className: classNameFromProps,
            projectId,
            readOnly,
        } = this.props;

        const {
            searchInputValue,
            searchItems,
        } = this.state;

        return (
            <div className={_cs(styles.users, classNameFromProps)}>
                <SearchList
                    onSearchInputChange={this.handleSearchInputChange}
                    onItemRemove={this.handleSearchItemRemove}
                    onItemsPull={this.handleSearchItemsPull}
                    searchInputValue={searchInputValue}
                    searchItems={searchItems}
                    projectId={projectId}
                    className={styles.searchList}
                    readOnly={readOnly}
                />
                <div className={styles.details}>
                    <ProjectUserList
                        className={styles.userList}
                        projectId={projectId}
                        readOnly={readOnly}
                        searchInputValue={searchInputValue}
                        searchEmptyComponent={SearchEmpty}
                        emptyComponent={Empty}
                    />
                    <ProjectUsergroupList
                        className={styles.usergroupList}
                        projectId={projectId}
                        readOnly={readOnly}
                        searchInputValue={searchInputValue}
                        searchEmptyComponent={SearchEmpty}
                        emptyComponent={Empty}
                    />
                </div>
            </div>
        );
    }
}
