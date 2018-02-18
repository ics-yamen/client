import CSSModules from 'react-css-modules';
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import update from '../../../vendor/react-store/utils/immutable-update';
import ListView from '../../../vendor/react-store/components/View/List/ListView';
import MultiSelectInput from '../../../vendor/react-store/components/Input/SelectInput/MultiSelectInput';

import { afStringsSelector } from '../../../redux';
import BoundError from '../../../components/BoundError';

import { updateAttribute } from './utils';
import styles from './styles.scss';

const propTypes = {
    id: PropTypes.number.isRequired,
    entryId: PropTypes.string.isRequired,
    data: PropTypes.object, // eslint-disable-line react/forbid-prop-types
    api: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
    attribute: PropTypes.object, // eslint-disable-line react/forbid-prop-types
    afStrings: PropTypes.func.isRequired,
};

const defaultProps = {
    data: {},
    attribute: {},
};

const emptyList = [];

const mapStateToProps = state => ({
    afStrings: afStringsSelector(state),
});

@BoundError
@connect(mapStateToProps)
@CSSModules(styles, { allowMultiple: true })
export default class Matrix2dList extends React.PureComponent {
    static rowKeyExtractor = d => d.key;
    static subsectorKeySelector = d => d.id;
    static subsectorLabelSelector = d => d.title;
    static propTypes = propTypes;
    static defaultProps = defaultProps;

    constructor(props) {
        super(props);
        updateAttribute(props);
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.attribute !== nextProps.attribute) {
            updateAttribute(nextProps);
        }
    }

    getSelectedSectors = (data, attribute) => {
        const selectedSectors = [];

        data.dimensions.forEach((dimension) => {
            const dimensionAttribute = attribute[dimension.id];

            if (dimensionAttribute) {
                dimension.subdimensions.forEach((subdimension) => {
                    const subdimensionAttribute = dimensionAttribute[subdimension.id];

                    if (subdimensionAttribute) {
                        data.sectors.forEach((sector) => {
                            const sectorAttribute = subdimensionAttribute[sector.id];

                            if (sectorAttribute) {
                                const sectorAttributeWithTitle = sectorAttribute.map(
                                    (d) => {
                                        const index = sector.subsectors.findIndex(s => s.id === d);

                                        return ({
                                            key: d,
                                            title: (sector.subsectors[index] || {}).title,
                                        });
                                    },
                                );

                                selectedSectors.push({
                                    sector,
                                    dimension,
                                    subdimension,
                                    subsectors: sectorAttribute,
                                    subsectorsWithTitle: sectorAttributeWithTitle,
                                    key: `${sector.id}-${dimension.id}-${subdimension.id}`,
                                });
                            }
                        });
                    }
                });
            }
        });
        return selectedSectors;
    }

    createDimensionFilterData = (attribute) => {
        const filterValues = [];
        Object.keys(attribute).forEach((key) => {
            const dimension = attribute[key];
            let dimensionExists = false;

            Object.keys(dimension).forEach((subKey) => {
                if (Object.values(dimension[subKey].length > 0)) {
                    filterValues.push(subKey);
                    dimensionExists = true;
                }
            });

            if (dimensionExists) {
                filterValues.push(key);
            }
        });


        return {
            values: filterValues,
            number: undefined,
        };
    }

    createSectorFilterData = (attribute) => {
        const filterValues = [];
        Object.keys(attribute).forEach((key) => {
            const dimension = attribute[key];

            Object.keys(dimension).forEach((subKey) => {
                const subdimension = dimension[subKey];

                Object.keys(subdimension).forEach((sectorKey) => {
                    const subsectors = subdimension[sectorKey];
                    if (subsectors) {
                        if (filterValues.indexOf(sectorKey) === -1) {
                            filterValues.push(sectorKey);
                        }

                        filterValues.push(...subsectors);
                    }
                });
            });
        });

        return {
            values: filterValues,
            number: undefined,
        };
    }

    createExportData = (attribute) => {
        const excelValues = [];
        const reportValues = [];

        Object.keys(attribute).forEach((key) => {
            const dimension = attribute[key];
            const dimensionData = this.props.data.dimensions.find(d => d.id === key);

            Object.keys(dimension).forEach((subKey) => {
                const subdimension = dimension[subKey];
                const subdimensionData = dimensionData.subdimensions.find(d => d.id === subKey);

                Object.keys(subdimension).forEach((sectorKey) => {
                    const sectorData = this.props.data.sectors.find(s => s.id === sectorKey);
                    const subsectors = subdimension[sectorKey];

                    if (subsectors) {
                        excelValues.push([
                            dimensionData.title,
                            subdimensionData.title,
                            sectorData.title,
                            subsectors.map(ss => sectorData.subsectors.find(sd => sd.id === ss)).join(','),
                        ]);
                        reportValues.push(`${sectorKey}-${key}-${subKey}`);
                    }
                });
            });
        });

        return {
            excel: {
                type: 'lists',
                values: excelValues,
            },
            report: {
                keys: reportValues,
            },
        };
    }

    handleSelectSubsectorChange = (dimensionId, subdimensionId, sectorId, subsectors) => {
        const {
            attribute,
            api,
            id,
            entryId,
        } = this.props;

        const settings = { $auto: {
            [dimensionId]: { $auto: {
                [subdimensionId]: { $auto: {
                    [sectorId]: { $auto: {
                        $set: subsectors,
                    } },
                } },
            } },
        } };

        const newAttribute = update(attribute, settings);

        api.getEntryModifier(entryId)
            .setAttribute(id, newAttribute)
            .apply();
    }

    renderTagUnit = (key, data) => (
        <div
            key={key}
            className={styles['tag-unit']}
        >
            <div className={styles['tag-dimension']} >
                {data.dimension.title}

                <span
                    className={styles['tag-sub-dimension']}
                >
                    {data.subdimension.title}
                </span>
            </div>
            <div
                className={styles['tag-sector']}
            >
                {data.sector.title}
                <MultiSelectInput
                    className={styles['tag-sector-select']}
                    value={data.subsectors}
                    options={data.sector.subsectors}
                    keySelector={Matrix2dList.subsectorKeySelector}
                    labelSelector={Matrix2dList.subsectorLabelSelector}
                    placeholder={this.props.afStrings('subsectorsLabel')}
                    label={this.props.afStrings('subsectorsLabel')}
                    onChange={subsectors => this.handleSelectSubsectorChange(
                        data.dimension.id,
                        data.subdimension.id,
                        data.sector.id,
                        subsectors,
                    )}
                />
            </div>
        </div>
    )

    render() {
        const { data, attribute } = this.props;
        const selectedSectors = this.getSelectedSectors(data, attribute);

        return (
            <div styleName="matrix-2d-list">
                <ListView
                    keyExtractor={Matrix2dList.rowKeyExtractor}
                    data={selectedSectors || emptyList}
                    modifier={this.renderTagUnit}
                    styleName="list"
                />
            </div>
        );
    }
}