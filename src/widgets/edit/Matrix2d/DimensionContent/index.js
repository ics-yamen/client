import PropTypes from 'prop-types';
import React from 'react';

import FaramGroup from '#rscg/FaramGroup';
import FaramList from '#rscg/FaramList';
import SortableListView from '#rscv/SortableListView';
import NonFieldErrors from '#rsci/NonFieldErrors';
import PrimaryButton from '#rsca/Button/PrimaryButton';
import TextInput from '#rsci/TextInput';
import ColorInput from '#rsci/ColorInput';
import { randomString } from '#rsu/common';

import _ts from '#ts';
import { iconNames } from '#constants';

import LinkWidgetModal from '#widgetComponents/LinkWidgetModal';
import GeoLink from '#widgetComponents/GeoLink';

import SubdimensionRow from './SubdimensionRow';
import styles from './styles.scss';

const propTypes = {
    index: PropTypes.number.isRequired,
    className: PropTypes.string,
    widgetKey: PropTypes.string.isRequired,
    onNestedModalChange: PropTypes.func.isRequired,
};

const defaultProps = {
    className: '',
};

export default class DimensionContent extends React.PureComponent {
    static propTypes = propTypes;
    static defaultProps = defaultProps;

    static keyExtractor = elem => elem.id;

    static addSubdimensionClick = subdimensions => ([
        ...subdimensions,
        {
            id: randomString(16).toLowerCase(),
            title: '',
            tooltip: '',
        },
    ])

    static rendererParams = (key, elem, i) => ({
        index: i,
    })

    constructor(props) {
        super(props);

        this.state = { showLinkModal: false };
    }

    handleAddFromWidgetClick = () => {
        this.setState({
            showLinkModal: true,
        }, () => this.props.onNestedModalChange(true));
    }

    handleLinkModalClose = () => {
        this.setState({
            showLinkModal: false,
        }, () => this.props.onNestedModalChange(false));
    }

    addFromWidgetClick = (items, _, listOfNewItems) => {
        const newListOfItems = listOfNewItems.map(r => ({
            id: randomString(16).toLowerCase(),
            title: r.label,
            originalWidget: r.originalWidget,
            originalKey: r.originalKey,
            tooltip: '',
        }));

        this.setState({
            showLinkModal: false,
        }, () => this.props.onNestedModalChange(false));

        return [
            ...items,
            ...newListOfItems,
        ];
    };

    render() {
        const { showLinkModal } = this.state;

        const {
            index,
            className,
        } = this.props;

        return (
            <div className={className}>
                <FaramGroup faramElementName={String(index)}>
                    <NonFieldErrors
                        className={styles.error}
                        faramElement
                    />
                    <div className={styles.editDimension}>
                        <ColorInput
                            // className={styles.input}
                            faramElementName="color"
                            label={_ts('widgets.editor.matrix2d', 'colorLabel')}
                        />
                        <TextInput
                            className={styles.input}
                            faramElementName="title"
                            label={_ts('widgets.editor.matrix2d', 'unnamedDimensionLabel', { index: index + 1 })}
                            autoFocus
                        />
                        <TextInput
                            className={styles.input}
                            faramElementName="tooltip"
                            label={_ts('widgets.editor.matrix2d', 'tooltipLabel')}
                        />
                    </div>
                    <FaramList
                        faramElementName="subdimensions"
                        keySelector={DimensionContent.keyExtractor}
                    >
                        <NonFieldErrors
                            className={styles.error}
                            faramElement
                        />
                        <header className={styles.header}>
                            <h4>
                                {_ts('widgets.editor.matrix2d', 'subdimensionsHeaderTitle')}
                            </h4>
                            <div className={styles.buttonContainer} >
                                <GeoLink
                                    faramElementName="add-from-geo-btn"
                                    faramAction={this.addFromWidgetClick}
                                />
                                <PrimaryButton
                                    transparent
                                    iconName={iconNames.add}
                                    onClick={this.handleAddFromWidgetClick}
                                >
                                    {_ts('widgets.editor.matrix2d', 'addFromWidgets')}
                                </PrimaryButton>
                                {showLinkModal &&
                                    <LinkWidgetModal
                                        onClose={this.handleLinkModalClose}
                                        widgetKey={this.props.widgetKey}
                                        faramElementName="add-from-widget-btn"
                                        faramAction={this.addFromWidgetClick}
                                    />
                                }
                                <PrimaryButton
                                    faramElementName="add-btn"
                                    faramAction={DimensionContent.addSubdimensionClick}
                                    iconName={iconNames.add}
                                    transparent
                                >
                                    {_ts('widgets.editor.matrix2d', 'addSubdimensionButtonTitle')}
                                </PrimaryButton>
                            </div>
                        </header>
                        <SortableListView
                            faramElement
                            className={styles.cellList}
                            dragHandleClassName={styles.dragHandle}
                            itemClassName={styles.item}
                            rendererParams={DimensionContent.rendererParams}
                            renderer={SubdimensionRow}
                        />
                    </FaramList>
                </FaramGroup>
            </div>
        );
    }
}
