import CSSModules from 'react-css-modules';
import PropTypes from 'prop-types';
import React from 'react';
import { SketchPicker } from 'react-color';
import update from '../../../../../public/utils/immutable-update';

import {
    TextInput,
} from '../../../../../public/components/Input';
import {
    TransparentPrimaryButton,
    TransparentDangerButton,
    Button,
    PrimaryButton,
} from '../../../../../public/components/Action';
import {
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    ListView,
} from '../../../../../public/components/View';
import { iconNames } from '../../../../../common/constants';
import { randomString } from '../../../../../public/utils/common';

import styles from './styles.scss';


const propTypes = {
    editAction: PropTypes.func.isRequired,
    onChange: PropTypes.func.isRequired, //eslint-disable-line
    data: PropTypes.object, //eslint-disable-line
};

const emptyList = [];
const emptyObject = {};

@CSSModules(styles)
export default class ScaleFrameworkList extends React.PureComponent {
    static rowKeyExtractor = d => d.key;
    static propTypes = propTypes;

    constructor(props) {
        super(props);

        const scaleUnits = (this.props.data || emptyObject).scaleUnits || emptyList;

        this.state = {
            showEditModal: false,
            activeScaleUnit: scaleUnits[0] || emptyObject,
            scaleUnits,
        };
        this.props.editAction(this.handleEdit);
    }

    getActiveSelectionStyle = (key) => {
        const { activeScaleUnit } = this.state;
        const scaleUnitStyle = ['edit-scale-unit'];
        if (activeScaleUnit.key === key) {
            scaleUnitStyle.push('active');
        }
        const styleNames = scaleUnitStyle.map(d => styles[d]);
        return styleNames.join(' ');
    }

    getEditScaleUnits = (key, data) => (
        <div
            className={this.getActiveSelectionStyle(key)}
            key={key}
        >
            <div className={styles['color-box-container']}>
                <span className={styles['color-label']}>Color</span>
                <button
                    className={styles['color-box']}
                    onClick={() => this.handleColorBoxClick(key)}
                    style={{ backgroundColor: data.color }}
                />
            </div>
            <TextInput
                className={styles['title-input']}
                label="Title"
                placeholder="eg: Reliable"
                onChange={(value) => { this.handleScaleUnitValueInputChange(key, value); }}
                onFocus={() => this.handleTextInputOnFocus(key)}
                value={data.title}
                showHintAndError={false}
            />
            <TransparentDangerButton
                className={styles['delete-button']}
                onClick={() => { this.handleScaleUnitRemoveButtonClick(key); }}
            >
                <span className={iconNames.delete} />
            </TransparentDangerButton>
        </div>
    )

    getScale = (key, data) => (
        <button
            key={key}
            title={data.title}
            className={styles['scale-unit']}
            style={{ backgroundColor: data.color }}
        />
    )

    handleTextInputOnFocus = (key) => {
        const { scaleUnits } = this.state;
        const index = scaleUnits.findIndex(d => d.key === key);

        this.setState({
            activeScaleUnit: scaleUnits[index],
        });
    }

    handleColorBoxClick = (key) => {
        const { scaleUnits } = this.state;
        const index = scaleUnits.findIndex(d => d.key === key);

        this.setState({
            activeScaleUnit: scaleUnits[index],
        });
    }

    handleEdit = () => {
        this.setState({ showEditModal: true });
    }

    handleAddScaleUnitButtonClick = () => {
        this.addScaleUnit();
    }

    handleEditModalClose = () => {
        this.setState({ showEditModal: false });
    }

    handleModalCancelButtonClick = () => {
        this.setState({
            showEditModal: false,
            scaleUnits: (this.props.data || emptyObject).scaleUnits || emptyList,
        });
    }

    handleModalSaveButtonClick = () => {
        this.setState({ showEditModal: false });
        const { scaleUnits } = this.state;
        const newScaleUnits = {
            ...this.props.data,
            scaleUnits,
        };
        this.props.onChange(newScaleUnits);
    }

    handleScaleUnitValueInputChange = (key, value) => {
        const rowIndex = this.state.scaleUnits.findIndex(d => d.key === key);

        const settings = {
            [rowIndex]: {
                title: { $set: value },
            },
        };
        const newScaleUnits = update(this.state.scaleUnits, settings);

        this.setState({
            scaleUnits: newScaleUnits,
            activeScaleUnit: newScaleUnits[rowIndex],
        });
    }

    handleScaleUnitRemoveButtonClick = (key) => {
        const settings = {
            $filter: d => d.key !== key,
        };
        const newScaleUnits = update(this.state.scaleUnits, settings);
        this.setState({ scaleUnits: newScaleUnits });
    };

    handleColorChange = (newColor) => {
        const { activeScaleUnit } = this.state;
        const rowIndex = this.state.scaleUnits.findIndex(d => d.key === activeScaleUnit.key);

        const settings = {
            [rowIndex]: {
                color: { $set: newColor.hex },
            },
        };

        const newScaleUnits = update(this.state.scaleUnits, settings);

        this.setState({ scaleUnits: newScaleUnits });
    }

    addScaleUnit = () => {
        const newScaleUnit = {
            key: randomString(16).toLowerCase(),
            title: '',
            color: '#ffffff',
        };

        this.setState({
            scaleUnits: [
                ...this.state.scaleUnits,
                newScaleUnit,
            ],
            activeScaleUnit: newScaleUnit,
        });
    }

    render() {
        const {
            scaleUnits,
            showEditModal,
            activeScaleUnit,
        } = this.state;

        return (
            <div styleName="scale-list">
                <ListView
                    styleName="scale"
                    data={scaleUnits}
                    keyExtractor={ScaleFrameworkList.rowKeyExtractor}
                    modifier={this.getScale}
                />
                <Modal
                    styleName="edit-scales-modal"
                    show={showEditModal}
                    onClose={this.handleEditModalClose}
                >
                    <ModalHeader
                        title="Edit scales"
                        rightComponent={
                            <TransparentPrimaryButton
                                iconName={iconNames.add}
                                onClick={this.handleAddScaleUnitButtonClick}
                            >
                                Add scale unit
                            </TransparentPrimaryButton>
                        }
                    />
                    <ModalBody styleName="scale-units-container">
                        <ListView
                            styleName="list"
                            data={scaleUnits}
                            keyExtractor={ScaleFrameworkList.rowKeyExtractor}
                            modifier={this.getEditScaleUnits}
                        />
                        <SketchPicker
                            color={activeScaleUnit.color}
                            onChange={this.handleColorChange}
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            onClick={this.handleModalCancelButtonClick}
                        >
                            Cancel
                        </Button>
                        <PrimaryButton
                            onClick={this.handleModalSaveButtonClick}
                        >
                            Save
                        </PrimaryButton>
                    </ModalFooter>
                </Modal>
            </div>
        );
    }
}