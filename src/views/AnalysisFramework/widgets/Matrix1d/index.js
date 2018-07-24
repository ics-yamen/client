import PropTypes from 'prop-types';
import React from 'react';

import { randomString } from '#rs/utils/common';
import update from '#rs/utils/immutable-update';

import ColorInput from '#rs/components/Input/ColorInput';
import TextInput from '#rs/components/Input/TextInput';
import Button from '#rs/components/Action/Button';
import PrimaryButton from '#rs/components/Action/Button/PrimaryButton';
import AccentButton from '#rs/components/Action/Button/AccentButton';
import Modal from '#rs/components/View/Modal';
import ModalHeader from '#rs/components/View/Modal/Header';
import ModalBody from '#rs/components/View/Modal/Body';
import ModalFooter from '#rs/components/View/Modal/Footer';
import DangerButton from '#rs/components/Action/Button/DangerButton';
import ListView from '#rs/components/View/List/ListView';
import SortableList from '#rs/components/View/SortableList';
import BoundError from '#rs/components/General/BoundError';

import _ts from '#ts';
import { iconNames } from '#constants';
import WidgetError from '#components/WidgetError';

import MatrixRow from './MatrixRow';
import styles from './styles.scss';

const propTypes = {
    title: PropTypes.string.isRequired,
    editAction: PropTypes.func.isRequired,
    onChange: PropTypes.func.isRequired,
    data: PropTypes.object, // eslint-disable-line react/forbid-prop-types
};

const defaultProps = {
    data: {
        rows: [],
    },
};

const emptyList = [];

@BoundError(WidgetError)
export default class Matrix1dOverview extends React.PureComponent {
    static rowKeyExtractor = d => d.key;
    static cellKeyExtractor = d => d.key;
    static propTypes = propTypes;
    static defaultProps = defaultProps;

    constructor(props) {
        super(props);

        const data = this.props.data || { rows: emptyList };
        const activeRow = data.rows[0] ? data.rows[0].key : 0;

        this.state = {
            showEditModal: false,
            title: props.title,
            activeRow,
            data,
        };

        this.props.editAction(this.handleEdit);
    }

    componentWillReceiveProps(nextProps) {
        const data = nextProps.data || { rows: emptyList };
        const activeRow = data.rows[0] ? data.rows[0].key : 0;

        this.setState({
            data,
            activeRow,
        });
    }

    handleRowSortEnd = (newData) => {
        const settings = {
            rows: { $set: newData },
        };
        const data = update(this.state.data, settings);
        this.setState({ data });
    }

    handleColorChange = (newColor, key) => {
        const { data } = this.state;
        const rowIndex = data.rows.findIndex(d => d.key === key);

        const settings = {
            rows: {
                [rowIndex]: {
                    color: { $set: newColor },
                },
            },
        };

        const newData = update(this.state.data, settings);

        this.setState({ data: newData });
    }

    handleEdit = () => {
        this.setState({ showEditModal: true });
    }

    handleRowDataChange = (key, cells) => {
        const { data } = this.state;
        const rowIndex = data.rows.findIndex(d => d.key === key);
        const settings = {
            rows: {
                [rowIndex]: {
                    cells: { $set: cells },
                },
            },
        };
        const newData = update(data, settings);

        this.props.onChange(
            newData,
        );
    }

    handleRowRemoveButtonClick = (key) => {
        const { data } = this.state;
        const rowIndex = data.rows.findIndex(d => d.key === key);
        const settings = {
            rows: {
                $splice: [[rowIndex, 1]],
            },
        };
        const newData = update(data, settings);
        const activeRow = newData.rows[0] ? newData.rows[0].key : 0;

        this.setState({
            data: newData,
            activeRow,
        });
    }

    handleRowValueInputChange = (key, value, name) => {
        const { data } = this.state;
        const rowIndex = data.rows.findIndex(d => d.key === key);
        const settings = {
            rows: {
                [rowIndex]: {
                    [name]: { $set: value },
                },
            },
        };
        const newData = update(data, settings);
        this.setState({ data: newData });
    }

    handleAddRowButtonClick = () => {
        const { data } = this.state;

        const newRow = {
            key: randomString(16).toLowerCase(),
            title: '',
            tooltip: '',
            color: '#000000',
            cells: emptyList,
        };
        const settings = {
            rows: {
                $push: [newRow],
            },
        };
        const newData = update(data, settings);
        this.setState({
            data: newData,
            activeRow: newRow.key,
        });
    }

    handleEditRowModalCancelButtonClick = () => {
        this.setState({
            showEditModal: false,
            data: this.props.data,
            title: this.props.title,
        });
    }

    handleEditRowModalSaveButtonClick = () => {
        this.setState({
            showEditModal: false,
        });
        this.props.onChange(
            this.state.data,
            this.state.title,
        );
    }

    handleCellSortEnd = (newCells) => {
        const {
            data: parentData,
            activeRow,
        } = this.state;

        const rowIndex = parentData.rows.findIndex(r => r.key === activeRow);

        if (rowIndex !== -1) {
            const settings = {
                rows: {
                    [rowIndex]: {
                        cells: { $set: newCells },
                    },
                },
            };
            const newData = update(parentData, settings);
            this.setState({ data: newData });
        }
    }

    handleCellRemoveButtonClick = (key) => {
        const {
            data: parentData,
            activeRow,
        } = this.state;

        const rowIndex = parentData.rows.findIndex(r => r.key === activeRow);

        if (rowIndex !== -1) {
            const cells = parentData.rows[rowIndex].cells || emptyList;
            const cellIndex = cells.findIndex(d => d.key === key);
            const settings = {
                rows: {
                    [rowIndex]: {
                        cells: { $splice: [[cellIndex, 1]] },
                    },
                },
            };
            const newData = update(parentData, settings);
            this.setState({ data: newData });
        }
    }

    handleAddCellButtonClick = () => {
        const newCell = {
            key: randomString(16).toLowerCase(),
            value: '',
        };
        const {
            data: parentData,
            activeRow,
        } = this.state;

        const rowIndex = parentData.rows.findIndex(r => r.key === activeRow);

        if (rowIndex !== -1) {
            const settings = {
                rows: {
                    [rowIndex]: {
                        cells: { $auto: {
                            $push: [newCell],
                        } },
                    },
                },
            };
            const newData = update(parentData, settings);
            this.setState({ data: newData });
        }
    }

    handleCellValueInputChange = (key, value) => {
        const {
            data: parentData,
            activeRow,
        } = this.state;

        const rowIndex = parentData.rows.findIndex(r => r.key === activeRow);

        if (rowIndex !== -1) {
            const cells = parentData.rows[rowIndex].cells || emptyList;
            const cellIndex = cells.findIndex(d => d.key === key);
            const settings = {
                rows: {
                    [rowIndex]: {
                        cells: {
                            [cellIndex]: {
                                value: { $set: value },
                            },
                        },
                    },
                },
            };
            const newData = update(parentData, settings);
            this.setState({ data: newData });
        }
    }

    handleWidgetTitleChange = (value) => {
        this.setState({ title: value });
    }

    handleRowClick = (activeRow) => {
        this.setState({ activeRow });
    }

    renderEditRow = (key, data) => {
        const { activeRow } = this.state;
        const rowStyle = [styles.rowTitleButton];
        if (activeRow === key) {
            rowStyle.push(styles.active);
        }

        return (
            <button
                className={rowStyle.join(' ')}
                key={key}
                onClick={() => this.handleRowClick(key)}
            >
                { data.title || _ts('framework.matrix1dWidget', 'untitledRowTitle') }
            </button>
        );
    }

    renderRowDragHandle = (key) => {
        const { activeRow } = this.state;
        const dragStyle = [styles.dragHandle];
        if (activeRow === key) {
            dragStyle.push(styles.active);
        }
        return (
            <span className={`${iconNames.hamburger} ${dragStyle.join(' ')}`} />
        );
    };

    renderCellDragHandle = () => {
        const dragStyle = [styles.dragHandle];
        return (
            <span className={`${iconNames.hamburger} ${dragStyle.join(' ')}`} />
        );
    };

    renderRowEditFields = () => {
        const {
            activeRow: key,
            data: parentData,
        } = this.state;

        const rowIndex = parentData.rows.findIndex(r => r.key === key);
        const data = parentData.rows[rowIndex];

        return (
            <div className={styles.editRow}>
                <ColorInput
                    label={_ts('framework.matrix1dWidget', 'colorLabel')}
                    onChange={newColor => this.handleColorChange(newColor, key)}
                    showHintAndError={false}
                    value={data.color}
                />
                <TextInput
                    className={styles.titleInput}
                    label={_ts('framework.matrix1dWidget', 'titleLabel')}
                    placeholder={_ts('framework.matrix1dWidget', 'optionPlaceholder')}
                    onChange={value => this.handleRowValueInputChange(key, value, 'title')}
                    value={data.title}
                    showHintAndError={false}
                    autoFocus
                />
                <TextInput
                    className={styles.titleInput}
                    label={_ts('framework.matrix1dWidget', 'tooltipTitle')}
                    placeholder={_ts('framework.matrix1dWidget', 'tooltipPlaceholder')}
                    onChange={value => this.handleRowValueInputChange(key, value, 'tooltip')}
                    showHintAndError={false}
                    value={data.tooltip}
                />
                <DangerButton
                    className={styles.deleteButton}
                    onClick={() => this.handleRowRemoveButtonClick(key)}
                >
                    <span className={iconNames.delete} />
                </DangerButton>
            </div>
        );
    }

    renderEditCell = (key, data) => (
        <div
            className={`${styles.editCell} ${styles.draggableItem}`}
            key={key}
        >
            <TextInput
                className={styles.titleInput}
                label={_ts('framework.matrix1dWidget', 'titleLabel')}
                placeholder={_ts('framework.matrix1dWidget', 'titlePlaceholderOverview')}
                onChange={value => this.handleCellValueInputChange(key, value)}
                showHintAndError={false}
                value={data.value}
                autoFocus
            />
            <DangerButton
                className={styles.deleteButton}
                onClick={() => this.handleCellRemoveButtonClick(key)}
            >
                <span className={iconNames.delete} />
            </DangerButton>
        </div>
    )

    renderRowCells = () => {
        const {
            data: parentData,
            activeRow,
        } = this.state;

        const headerTitle = _ts('framework.matrix1dWidget', 'matrix1DModalTitle');
        const addCellButtonLabel = _ts('framework.matrix1dWidget', 'addCellButtonLabel');

        const rowIndex = parentData.rows.findIndex(r => r.key === activeRow);
        let additionalStyle = '';

        const cells = parentData.rows[rowIndex].cells || emptyList;

        if (cells.length === 0) {
            additionalStyle = styles.noItems;
        }

        return (
            <div className={styles.matrixCells}>
                <header
                    className={styles.header}
                >
                    <h4>{ headerTitle }</h4>
                    <AccentButton
                        iconName={iconNames.add}
                        onClick={this.handleAddCellButtonClick}
                        transparent
                    >
                        { addCellButtonLabel }
                    </AccentButton>
                </header>
                <SortableList
                    className={`${styles.cellList} ${additionalStyle}`}
                    data={cells}
                    modifier={this.renderEditCell}
                    dragHandleModifier={this.renderCellDragHandle}
                    sortableItemClass={styles.cellListItem}
                    onChange={this.handleCellSortEnd}
                    keyExtractor={Matrix1dOverview.cellKeyExtractor}
                />
            </div>
        );
    }

    renderRow = (key, data) => (
        <MatrixRow
            key={key}
            title={data.title}
            cells={data.cells}
        />
    )

    renderEditRowModal = () => {
        const {
            data,
            showEditModal,
            title: titleValue,
            activeRow,
        } = this.state;

        if (!showEditModal) {
            return null;
        }

        const headerTitle = _ts('framework.matrix1dWidget', 'editRowModalTitle');
        const addRowButtonLabel = _ts('framework.matrix1dWidget', 'addRowButtonLabel');
        const titleInputLabel = _ts('framework.matrix1dWidget', 'titleLabel');
        const titleInputPlaceholder = _ts('framework.matrix1dWidget', 'titlePlaceholderScale');
        const cancelButtonLabel = _ts('framework.matrix1dWidget', 'cancelButtonLabel');
        const saveButtonLabel = _ts('framework.matrix1dWidget', 'saveButtonLabel');

        const RowDetail = this.renderRowEditFields;
        const RowCells = this.renderRowCells;
        const rowIndex = data.rows.findIndex(r => r.key === activeRow);

        let additionalStyle = '';

        if (data.rows.length === 0) {
            additionalStyle = styles.noItems;
        }

        return (
            <Modal className={styles.editRowModal}>
                <ModalHeader
                    title={headerTitle}
                    rightComponent={
                        <PrimaryButton
                            onClick={this.handleAddRowButtonClick}
                            transparent
                        >
                            { addRowButtonLabel }
                        </PrimaryButton>
                    }
                />
                <ModalBody className={styles.body}>
                    <div className={styles.generalInfoContainer}>
                        <TextInput
                            autoFocus
                            className={styles.titleInput}
                            label={titleInputLabel}
                            onChange={this.handleWidgetTitleChange}
                            placeholder={titleInputPlaceholder}
                            selectOnFocus
                            showHintAndError={false}
                            value={titleValue}
                        />
                    </div>
                    <div className={styles.modalRowsContent}>
                        <div className={styles.leftContainer}>
                            <SortableList
                                className={`${styles.rowList} ${additionalStyle}`}
                                data={data.rows}
                                modifier={this.renderEditRow}
                                onChange={this.handleRowSortEnd}
                                sortableItemClass={styles.rowListItem}
                                keyExtractor={Matrix1dOverview.rowKeyExtractor}
                                dragHandleModifier={this.renderRowDragHandle}
                            />
                        </div>
                        <div className={styles.rightContainer}>
                            {rowIndex !== -1 ? ([
                                <RowDetail key="row-detail" />,
                                <RowCells key="row-cells" />,
                            ]) : (
                                <span className={styles.emptyContainer}>
                                    {_ts('framework.matrix1dWidget', 'noRowSelected')}
                                </span>
                            )}
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button
                        onClick={this.handleEditRowModalCancelButtonClick}
                    >
                        { cancelButtonLabel }
                    </Button>
                    <PrimaryButton
                        onClick={this.handleEditRowModalSaveButtonClick}
                    >
                        { saveButtonLabel }
                    </PrimaryButton>
                </ModalFooter>
            </Modal>
        );
    }

    render() {
        const { data } = this.state;
        const EditRowModal = this.renderEditRowModal;

        return (
            <div className={styles.overview}>
                <ListView
                    data={data.rows}
                    className={styles.rows}
                    keyExtractor={Matrix1dOverview.rowKeyExtractor}
                    modifier={this.renderRow}
                />
                <EditRowModal />
            </div>
        );
    }
}