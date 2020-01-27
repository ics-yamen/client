import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { _cs } from '@togglecorp/fujs';

import Icon from '#rscg/Icon';

import {
    editEntriesClearEntryGroupSelectionAction,
    editEntriesSetEntryGroupSelectionAction,
} from '#redux';

import styles from './styles.scss';

const propTypes = {
    className: PropTypes.string,
    isSelected: PropTypes.bool,
    isCurrentEntryTagged: PropTypes.bool,
};

const defaultProps = {
    className: undefined,
    isSelected: false,
    isCurrentEntryTagged: false,
};

const mapDispatchToProps = dispatch => ({
    clearEntryGroupSelection: params => dispatch(editEntriesClearEntryGroupSelectionAction(params)),
    setEntryGroupSelection: params => dispatch(editEntriesSetEntryGroupSelectionAction(params)),
});

@connect(undefined, mapDispatchToProps)
export default class EntryGroupModalCell extends React.PureComponent {
    static propTypes = propTypes;
    static defaultProps = defaultProps;

    handleEntryAdd = () => {
        console.warn('add entry');
        const {
            selectedEntryKey,
            selectedEntryServerId,
            setEntryGroupSelection,
            entryGroupKey,
            labelId,
            leadId,
        } = this.props;

        setEntryGroupSelection({
            leadId,
            entryGroupKey,
            selection: {
                entryClientId: selectedEntryKey,
                entryId: selectedEntryServerId,
                labelId,
            },
        });
    }

    handleEntryRemove = () => {
        const {
            clearEntryGroupSelection,
            entryGroupKey,
            labelId,
            leadId,
        } = this.props;

        clearEntryGroupSelection({
            entryGroupKey,
            labelId,
            leadId,
        });
    }

    render() {
        const {
            className,
            isSelected,
            isCurrentEntryTagged,
        } = this.props;

        return (
            <td
                className={_cs(
                    className,
                    styles.cell,
                    isSelected && styles.selected,
                    isCurrentEntryTagged && styles.tagged,
                )}
            >
                {isCurrentEntryTagged && (
                    <button
                        className={styles.button}
                        onClick={this.handleEntryRemove}
                    />
                )}
                {!isSelected && (
                    <button
                        className={_cs(styles.button, styles.addButtonCell)}
                        onClick={this.handleEntryAdd}
                    >
                        <Icon name="addCircle" />
                    </button>
                )}
            </td>
        );
    }
}
