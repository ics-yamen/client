import PropTypes from 'prop-types';
import React, { useCallback, useMemo, useState } from 'react';
import {
    _cs,
    isNotDefined,
    isDefined,
    compareString,
    compareNumber,
} from '@togglecorp/fujs';

import { DefaultIcon } from '#rscv/ListItem';
import DismissableListItem from '#rsca/DismissableListItem';
import ListView from '#rscv/List/ListView';
import SegmentInput from '#rsci/SegmentInput';
import _ts from '#ts';

import styles from './styles.scss';

function ExtendedDismissableListItem(props) {
    const {
        value,
        polygons,
        className,
        ...otherProps
    } = props;

    return (
        <DismissableListItem
            {...otherProps}
            className={_cs(className, styles.extendedDismissableListItem)}
            labelClassName={styles.label}
            value={(
                <>
                    <div className={styles.text}>
                        {value}
                    </div>
                    {!!polygons && polygons.length > 0 && polygons.map(polygon => (
                        <DefaultIcon
                            key={polygon.id}
                            className={styles.polygon}
                            color={polygon.properties.color}
                            title={polygon.properties.title}
                        />
                    ))}
                </>
            )}
        />
    );
}

ExtendedDismissableListItem.propTypes = {
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.node, PropTypes.number]).isRequired,
    className: PropTypes.string,
    polygons: PropTypes.array, // eslint-disable-line react/forbid-prop-types
};

ExtendedDismissableListItem.defaultProps = {
    polygons: undefined,
    className: undefined,
};

function groupList(
    list,
    keySelector,
    modifier,
) {
    if (isNotDefined(list)) {
        return [];
    }
    const mapping = list.reduce(
        (acc, elem, i) => {
            const key = keySelector(elem);
            const value = modifier
                ? modifier(elem, key, i, acc)
                : elem;
            if (acc[key]) {
                acc[key].values.push(value);
            } else {
                acc[key] = {
                    key,
                    values: [value],
                };
            }
            return acc;
        },
        {},
    );
    return Object.values(mapping);
}

function createCombinedSelections(selections, polygons) {
    const newSelections = selections.map(
        item => ({ id: item }),
    );

    const selectionsMapping = new Set(selections);
    const geoAreaPolygonTuples = polygons
        .filter(polygon => isDefined(polygon.geoJson.properties.geoareas))
        .map(polygon => polygon.geoJson.properties.geoareas.map(geoarea => ({
            id: String(geoarea),
            geoJson: polygon.geoJson,
        })))
        .flat()
        .filter(item => !selectionsMapping.has(item.id));

    const newSelectionsFromPolygons = groupList(
        geoAreaPolygonTuples,
        e => e.id,
        e => e.geoJson,
    ).map(item => ({
        id: item.key,
        polygons: item.values,
    }));

    return [
        ...newSelections,
        ...newSelectionsFromPolygons,
    ];
}

const propTypes = {
    header: PropTypes.string,
    className: PropTypes.string,
    selections: PropTypes.array, // eslint-disable-line react/forbid-prop-types
    polygons: PropTypes.array, // eslint-disable-line react/forbid-prop-types
    geoOptionsById: PropTypes.object, // eslint-disable-line react/forbid-prop-types
    adminLevelTitles: PropTypes.array, // eslint-disable-line react/forbid-prop-types
    polygonDisabled: PropTypes.bool,
    polygonHidden: PropTypes.bool,
    onSelectionsChange: PropTypes.func,
    onPolygonsChange: PropTypes.func,
    onPolygonEditClick: PropTypes.func,
    readOnly: PropTypes.bool,
    sortHidden: PropTypes.bool,
};
const defaultProps = {
    header: undefined,
    className: undefined,
    onSelectionsChange: undefined,
    onPolygonsChange: undefined,
    onPolygonEditClick: undefined,
    selections: [],
    polygons: [],
    geoOptionsById: {},
    adminLevelTitles: [],
    polygonDisabled: false,
    polygonHidden: false,
    sortHidden: false,
    readOnly: false,
};

const sortOrderOptions = [
    {
        key: 'asc',
        label: _ts('components.geo.geoModal', 'ascendingLabel'),
    },
    {
        key: 'dsc',
        label: _ts('components.geo.geoModal', 'descendingLabel'),
    },
];

const sortTypeOptions = [
    {
        key: 'alphabetical',
        label: _ts('components.geo.geoModal', 'alphabeticalLabel'),
    },
    {
        key: 'overlaps',
        label: _ts('components.geo.geoModal', 'overlapsLabel'),
    },
];

const sortTypeKeySelector = d => d.key;
const sortTypeLabelSelector = d => d.label;

const GeoInputList = (props) => {
    const {
        header,
        className,

        selections,
        polygons,

        adminLevelTitles,
        geoOptionsById,

        polygonDisabled,
        polygonHidden,

        onSelectionsChange,
        onPolygonsChange,

        onPolygonEditClick,

        sortHidden,
        readOnly,
    } = props;

    const [sortOrder, setSortOrder] = useState('asc');
    const [sortType, setSortType] = useState('alphabetical');

    const handlePolygonEdit = useCallback(
        (id) => {
            const polygon = polygons.find(p => p.geoJson.id === id);
            if (!polygon) {
                console.error('Could not find index for polygon id', id);
                return;
            }
            if (onPolygonEditClick) {
                onPolygonEditClick(polygon);
            }
        },
        [polygons, onPolygonEditClick],
    );

    const handlePolygonRemove = useCallback(
        (id) => {
            const newPolygons = polygons.filter(p => p.geoJson.id !== id);
            if (onPolygonsChange) {
                onPolygonsChange(newPolygons);
            }
        },
        [onPolygonsChange, polygons],
    );

    const handleSelectionRemove = useCallback(
        (itemKey) => {
            const newSelections = selections.filter(v => v !== itemKey);
            if (onSelectionsChange) {
                onSelectionsChange(newSelections);
            }
        },
        [onSelectionsChange, selections],
    );

    // Selector for polygon
    const polygonKeySelector = useCallback(
        p => p.geoJson.id,
        [],
    );
    const polygonGroupKeySelector = useCallback(
        p => p.type,
        [],
    );

    // Selector for geo options
    const geoOptionKeySelector = useCallback(
        selection => selection.id,
        [],
    );
    const groupKeySelector = useCallback(
        (selection) => {
            const { adminLevel, region } = geoOptionsById[selection.id];
            return `${region}-${adminLevel}`;
        },
        [geoOptionsById],
    );

    const listRendererParams = useCallback(
        (key, value) => ({
            className: styles.item,
            itemKey: key,
            onDismiss: handleSelectionRemove,
            disabled: !!value.polygons || isNotDefined(onSelectionsChange),
            readOnly,

            value: geoOptionsById[key].title,
            polygons: value.polygons,
        }),
        [handleSelectionRemove, geoOptionsById, onSelectionsChange, readOnly],
    );

    const groupRendererParams = useCallback(
        (groupKey) => {
            const [regionKey, adminLevelKey] = groupKey.split('-');
            // FIXME: this can be made efficient
            const adminLevel = adminLevelTitles.find(
                a => String(a.regionKey) === regionKey && String(a.key) === adminLevelKey,
            );

            return {
                children: adminLevel
                    ? `${adminLevel.regionTitle} / ${adminLevel.title}`
                    : '',
            };
        },
        [adminLevelTitles],
    );

    const polygonGroupRendererParams = useCallback(
        groupKey => ({
            children: groupKey,
        }),
        [],
    );

    const polygonListRendererParams = useCallback(
        (key, polygon) => ({
            className: styles.item,
            itemKey: key,
            onDismiss: handlePolygonRemove,
            disabled: polygonDisabled || isNotDefined(onPolygonsChange),
            readOnly,
            onEdit: handlePolygonEdit,
            value: polygon.geoJson.properties.title,
            color: polygon.geoJson.properties.color,
        }),
        [handlePolygonEdit, handlePolygonRemove, polygonDisabled, onPolygonsChange, readOnly],
    );

    const newSelections = useMemo(
        () => {
            const tempSelections = createCombinedSelections(selections, polygons);
            const sortOrderValue = sortOrder === 'asc' ? 1 : -1;

            if (sortType === 'alphabetical') {
                return tempSelections.sort((a, b) => compareString(
                    geoOptionsById[a.id] ? geoOptionsById[a.id].title : '',
                    geoOptionsById[b.id] ? geoOptionsById[b.id].title : '',
                    sortOrderValue,
                ));
            } else if (sortType === 'overlaps') {
                return tempSelections.sort((a, b) => (
                    compareNumber(
                        a.polygons ? a.polygons.length : -1,
                        b.polygons ? b.polygons.length : -1,
                        sortOrderValue,
                    ) || compareString(
                        geoOptionsById[a.id] ? geoOptionsById[a.id].title : '',
                        geoOptionsById[b.id] ? geoOptionsById[b.id].title : '',
                    )
                ));
            }
            return tempSelections;
        },
        [selections, polygons, sortType, sortOrder, geoOptionsById],
    );

    return (
        <div className={_cs(className, styles.geoInputList)}>
            {header && (
                <h3 className={styles.heading}>
                    {header}
                </h3>
            )}
            {!sortHidden && (
                <div className={styles.sortInputs}>
                    <SegmentInput
                        className={styles.sortInput}
                        label={_ts('components.geo.geoModal', 'sortInputLabel')}
                        value={sortType}
                        onChange={setSortType}
                        options={sortTypeOptions}
                        keySelector={sortTypeKeySelector}
                        labelSelector={sortTypeLabelSelector}
                    />
                    <SegmentInput
                        className={styles.sortInput}
                        label={_ts('components.geo.geoModal', 'sortOrderLabel')}
                        value={sortOrder}
                        onChange={setSortOrder}
                        options={sortOrderOptions}
                        keySelector={sortTypeKeySelector}
                        labelSelector={sortTypeLabelSelector}
                    />
                </div>
            )}
            {!polygonHidden && (
                <ListView
                    data={polygons}
                    emptyComponent={null}
                    keySelector={polygonKeySelector}
                    renderer={DismissableListItem}
                    rendererParams={polygonListRendererParams}
                    groupKeySelector={polygonGroupKeySelector}
                    groupRendererParams={polygonGroupRendererParams}
                />
            )}
            <ListView
                data={newSelections}
                emptyComponent={null}
                keySelector={geoOptionKeySelector}
                renderer={ExtendedDismissableListItem}
                rendererParams={listRendererParams}
                groupKeySelector={groupKeySelector}
                groupRendererParams={groupRendererParams}
            />
        </div>
    );
};
GeoInputList.propTypes = propTypes;
GeoInputList.defaultProps = defaultProps;

export default GeoInputList;
