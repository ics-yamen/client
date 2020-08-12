import PropTypes from 'prop-types';
import React from 'react';
import { FaramGroup } from '@togglecorp/faram';

import DangerButton from '#rsca/Button/DangerButton';
import TextInput from '#rsci/TextInput';
import ColorInput from '#rsci/ColorInput';
import Checkbox from '#rsci/Checkbox';

import _ts from '#ts';

import styles from './styles.scss';

const propTypes = {
    index: PropTypes.number.isRequired,
};

export default class InputRow extends React.PureComponent {
    static propTypes = propTypes;

    static deleteClick = (options, index) => {
        const newOptions = [...options];
        newOptions.splice(index, 1);
        return newOptions;
    }

    render() {
        const { index } = this.props;
        return (
            <div className={styles.inputContainer}>
                <FaramGroup faramElementName={String(index)}>
                    <ColorInput
                        className={styles.colorInput}
                        faramElementName="color"
                        label={_ts('widgets.editor.scale', 'colorLabel')}
                        showSwatches
                    />
                    <TextInput
                        className={styles.titleInput}
                        faramElementName="label"
                        label={_ts('widgets.editor.scale', 'inputLabel', { index: index + 1 })}
                        placeholder={_ts('widgets.editor.scale', 'titlePlaceholderScale')}
                        autoFocus
                    />
                    <Checkbox
                        className={styles.checkboxInput}
                        faramElementName="defaultScaleUnit"
                        label={_ts('widgets.editor.scale', 'defaultLabel', { index: index + 1 })}
                    />
                </FaramGroup>
                <DangerButton
                    faramElementName={index}
                    faramAction={InputRow.deleteClick}
                    className={styles.deleteButton}
                    iconName="delete"
                    title={_ts('widgets.editor.scale', 'removeButtonTitle')}
                    transparent
                />
            </div>
        );
    }
}
