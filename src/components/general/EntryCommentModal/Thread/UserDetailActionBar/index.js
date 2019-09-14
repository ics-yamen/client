import React from 'react';
import PropTypes from 'prop-types';
import {
    _cs,
    compareDate,
} from '@togglecorp/fujs';
import memoize from 'memoize-one';

import DisplayPicture from '#components/viewer/DisplayPicture';
import FormattedDate from '#rscv/FormattedDate';
import modalize from '#rscg/Modalize';
import Button from '#rsca/Button';
import DropdownMenu from '#rsca/DropdownMenu';
import _ts from '#ts';
import EditHistoryModal from './EditHistoryModal';

import styles from './styles.scss';

const ButtonWrapper = (props) => {
    const {
        closeModal, // eslint-disable-line no-unused-vars, @typescript-eslint/no-unused-vars
        ...otherProps
    } = props;

    return (
        <Button {...otherProps} />
    );
};

ButtonWrapper.propTypes = {
    closeModal: PropTypes.func,
};

ButtonWrapper.defaultProps = {
    closeModal: undefined,
};

const propTypes = {
    userDetails: PropTypes.object, // eslint-disable-line react/forbid-prop-types
    className: PropTypes.string,
    onEditClick: PropTypes.func.isRequired,
    onDeleteClick: PropTypes.func.isRequired,
    onResolveClick: PropTypes.func.isRequired,
    textHistory: PropTypes.array.isRequired, // eslint-disable-line react/forbid-prop-types
    isParent: PropTypes.bool,
    hideActions: PropTypes.bool.isRequired,
};

const defaultProps = {
    className: undefined,
    isParent: false,
    userDetails: {},
};

const emptyObject = {};

export default class UserDetailActionBar extends React.PureComponent {
    static propTypes = propTypes;
    static defaultProps = defaultProps;

    constructor(props) {
        super(props);

        this.state = {
            showHistory: false,
        };
    }

    getSortedHistory = memoize(history => (
        [...history].sort((a, b) => compareDate(b.createdAt, a.createdAt))
    ));

    handleViewHistoryClick = () => {
        this.setState({ showHistory: true });
    }

    handleCloseHistoryClick = () => {
        this.setState({ showHistory: false });
    }

    render() {
        const {
            className,
            userDetails: {
                displayPicture,
                name,
            },
            onEditClick,
            onDeleteClick,
            onResolveClick,
            textHistory,
            isParent,
            hideActions,
        } = this.props;

        const { showHistory } = this.state;

        const isModified = textHistory.length > 1;
        const sortedHistory = this.getSortedHistory(textHistory);
        const modifiedAt = (sortedHistory[0] || emptyObject).createdAt;

        return (
            <div className={styles.userDetailActionBar}>
                <div className={styles.leftContainer}>
                    <DisplayPicture
                        className={_cs(styles.displayPicture, className)}
                        url={displayPicture}
                    />
                </div>
                <div className={styles.midContainer}>
                    <div className={styles.userName}>
                        {name}
                    </div>
                    <div className={styles.midBottomContainer}>
                        <FormattedDate
                            className={styles.date}
                            value={modifiedAt}
                            mode="dd-MM-yyyy hh:mm aaa"
                        />
                        {isModified && (
                            <div className={styles.edited}>
                                &nbsp;
                                {_ts('entryComments', 'editedFlagLabel')}
                            </div>
                        )}
                    </div>
                </div>
                {!hideActions && (
                    <div className={styles.rightContainer}>
                        <DropdownMenu
                            className={styles.dropdown}
                            dropdownIcon="menuDots"
                            dropdownClassName={styles.dropdownContainer}
                            dropdownIconClassName={styles.icon}
                            closeOnClick
                        >
                            {isParent && (
                                <ButtonWrapper
                                    className={styles.button}
                                    onClick={onResolveClick}
                                >
                                    {_ts('entryComments', 'resolveLabel')}
                                </ButtonWrapper>
                            )}
                            <ButtonWrapper
                                className={styles.button}
                                onClick={onEditClick}
                            >
                                {_ts('entryComments', 'editLabel')}
                            </ButtonWrapper>
                            <ButtonWrapper
                                className={styles.button}
                                onClick={onDeleteClick}
                            >
                                {_ts('entryComments', 'deleteLabel')}
                            </ButtonWrapper>
                            {isModified && (
                                <ButtonWrapper
                                    className={styles.button}
                                    onClick={this.handleViewHistoryClick}
                                >
                                    {_ts('entryComments', 'viewEditHistoryLabel')}
                                </ButtonWrapper>
                            )}
                        </DropdownMenu>
                    </div>
                )}
                {showHistory && (
                    <EditHistoryModal
                        history={sortedHistory}
                        closeModal={this.handleCloseHistoryClick}
                    />
                )}
            </div>
        );
    }
}
