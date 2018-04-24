import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import FaramGroup from '../../../../../vendor/react-store/components/Input/Faram/FaramGroup';
import SelectInput from '../../../../../vendor/react-store/components/Input/SelectInput';
import OrganigramSelectInput from '../../../../../components/OrganigramSelectInput';

import TabularInputs from '../TabularInputs';
import styles from './styles.scss';

import {
    editArySelectedSectorsSelector,
    affectedGroupsSelector,
    prioritySectorsSelector,
    specificNeedGroupsSelector,
    assessmentSummaryStringsSelector,
} from '../../../../../redux';

const propTypes = {
    className: PropTypes.string,
    // eslint-disable-next-line react/forbid-prop-types
    selectedSectors: PropTypes.array.isRequired,
    affectedGroups: PropTypes.arrayOf(PropTypes.object).isRequired,
    prioritySectors: PropTypes.arrayOf(PropTypes.object).isRequired,
    specificNeedGroups: PropTypes.arrayOf(PropTypes.object).isRequired,
    assessmentSummaryStrings: PropTypes.func.isRequired,
};

const defaultProps = {
    className: '',
};

const mapStateToProps = state => ({
    selectedSectors: editArySelectedSectorsSelector(state),
    affectedGroups: affectedGroupsSelector(state),
    prioritySectors: prioritySectorsSelector(state),
    specificNeedGroups: specificNeedGroupsSelector(state),
    assessmentSummaryStrings: assessmentSummaryStringsSelector(state),
});

@connect(mapStateToProps)
export default class CrossSector extends React.PureComponent {
    static propTypes = propTypes;
    static defaultProps = defaultProps;

    static nodeIdSelector = d => d.id;
    static nodeLabelSelector = d => d.title;
    static nodeChildrenSelector = d => d.children;

    constructor(props) {
        super(props);

        const { assessmentSummaryStrings } = props;
        this.rowFieldTitles = [
            assessmentSummaryStrings('prioritySector'),
            assessmentSummaryStrings('affectedGroup'),
            assessmentSummaryStrings('specificNeedGroup'),
        ];

        this.columnFieldTitles = [
            ' ',
            assessmentSummaryStrings('moderateAssistancePopulationUnknown'),
            assessmentSummaryStrings('severeAssistancePopulationUnknown'),
            assessmentSummaryStrings('assistancePopulationUnknown'),
        ];

        this.rowSubFieldTitles = [
            assessmentSummaryStrings('rank1Title'),
            assessmentSummaryStrings('rank2Title'),
            assessmentSummaryStrings('rank3Title'),
        ];
    }

    getClassName = (empty = false) => {
        const { className } = this.props;
        const classNames = [
            className,
            'cross-sector',
            styles.crossSector,
        ];

        if (empty) {
            classNames.push('empty');
            classNames.push(styles.empty);
        }

        return classNames.join(' ');
    }

    renderInput = (column, row, subRow) => {
        const {
            prioritySectors,
            affectedGroups,
            specificNeedGroups,
        } = this.props;

        if (row === 0) {
            return (
                <OrganigramSelectInput
                    faramElementName={`priority-sector-${subRow}-${column}`}
                    showHintAndError={false}
                    data={prioritySectors}
                    idSelector={CrossSector.nodeIdSelector}
                    labelSelector={CrossSector.nodeLabelSelector}
                    childrenSelector={CrossSector.nodeChildrenSelector}
                />
            );
        } else if (row === 1) {
            return (
                <OrganigramSelectInput
                    faramElementName={`affected-group-${subRow}-${column}`}
                    showHintAndError={false}
                    data={affectedGroups}
                    idSelector={CrossSector.nodeIdSelector}
                    labelSelector={CrossSector.nodeLabelSelector}
                    childrenSelector={CrossSector.nodeChildrenSelector}
                />
            );
        } else if (row === 2) {
            return (
                <SelectInput
                    faramElementName={`specific-need-group-${subRow}-${column}`}
                    showHintAndError={false}
                    options={specificNeedGroups}
                    labelSelector={CrossSector.nodeLabelSelector}
                    keySelector={CrossSector.nodeIdSelector}
                />
            );
        }

        return null;
    }

    render() {
        const {
            selectedSectors,
            assessmentSummaryStrings,
        } = this.props;


        if (selectedSectors.length < 3) {
            const className = this.getClassName(true);
            const emptyText = assessmentSummaryStrings('crossSectorEmptyText');

            return (
                <div className={className}>
                    { emptyText }
                </div>
            );
        }

        const className = this.getClassName();

        return (
            <FaramGroup faramElementName="crossSector">
                <TabularInputs
                    rowFieldTitles={this.rowFieldTitles}
                    columnFieldTitles={this.columnFieldTitles}
                    rowSubFieldTitles={this.rowSubFieldTitles}
                    classNames={{
                        wrapper: className,
                        table: styles.table,
                        head: styles.head,
                        body: styles.body,
                        row: styles.row,
                        header: styles.header,
                        cell: styles.cell,
                        sectionTitle: styles.sectionTitle,
                    }}
                    inputModifier={this.renderInput}
                />
            </FaramGroup>
        );
    }
}