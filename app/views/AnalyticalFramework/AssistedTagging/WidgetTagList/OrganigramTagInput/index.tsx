import React, { useMemo, useCallback } from 'react';
import {
    _cs,
    listToMap,
    listToGroupList,
    isDefined,
    randomString,
} from '@togglecorp/fujs';
import {
    ListView,
} from '@the-deep/deep-ui';

import {
    OrganigramWidget,
    OrganigramMappingsItem,
    KeyLabelEntity,
} from '#types/newAnalyticalFramework';
import { sortByOrder } from '#utils/common';

import { getOrganigramFlatOptions } from '#views/AnalyticalFramework/utils';
import CheckButton from '../../CheckButton';

import styles from './styles.css';

const cellKeySelector = (cell: KeyLabelEntity) => cell.key;

interface Props {
    className?: string;
    widget: OrganigramWidget;
    mappings: OrganigramMappingsItem[] | undefined;
    onMappingsChange: (
        newMappings: OrganigramMappingsItem[],
        widgetPk: string,
    ) => void;
    selectedTag: string | undefined;
    disabled?: boolean;
}

function OrganigramTagInput(props: Props) {
    const {
        className,
        widget,
        mappings,
        onMappingsChange,
        selectedTag,
        disabled,
    } = props;

    const sortedCells = useMemo(() => (
        sortByOrder(getOrganigramFlatOptions(widget?.properties?.options)) ?? []
    ), [widget?.properties?.options]);

    const optionKeysInMappings = useMemo(() => (
        listToMap(
            mappings?.filter((mappingItem) => mappingItem.tag === selectedTag),
            (mappingItem) => mappingItem.association.optionKey,
            () => true,
        )
    ), [
        mappings,
        selectedTag,
    ]);

    const mappingsGroupedByOptionKey = useMemo(() => (
        listToGroupList(
            mappings,
            (mappingItem) => mappingItem.association.optionKey,
        )
    ), [
        mappings,
    ]);

    const handleCellClick = useCallback((cellKey: string) => {
        if (!selectedTag) {
            return;
        }

        const selectedMappingsIndex = mappings?.findIndex((mapping) => (
            selectedTag === mapping.tag
            && mapping.association.optionKey === cellKey
        ));

        if (isDefined(selectedMappingsIndex) && selectedMappingsIndex !== -1) {
            const newMappings = [...(mappings ?? [])];
            newMappings.splice(selectedMappingsIndex, 1);

            onMappingsChange(newMappings, widget.id);
        } else {
            onMappingsChange([
                ...(mappings ?? []),
                {
                    tag: selectedTag,
                    widget: widget.id,
                    widgetType: widget.widgetId,
                    association: {
                        optionKey: cellKey,
                    },
                    clientId: randomString(),
                // FIXME: need to cast here because we cannot set id
                // and a proper fix would require more time
                } as OrganigramMappingsItem,
            ], widget.id);
        }
    }, [
        onMappingsChange,
        mappings,
        selectedTag,
        widget,
    ]);

    const cellRendererParams = useCallback((_: string, cell: KeyLabelEntity) => ({
        children: cell.label,
        name: cell.key,
        value: !!optionKeysInMappings?.[cell.key],
        badgeCount: mappingsGroupedByOptionKey?.[cell.key]?.length ?? 0,
        onClick: handleCellClick,
        disabled: !selectedTag || disabled,
    }), [
        disabled,
        handleCellClick,
        selectedTag,
        optionKeysInMappings,
        mappingsGroupedByOptionKey,
    ]);

    return (
        <ListView
            className={_cs(className, styles.organigramTagInput)}
            data={sortedCells}
            keySelector={cellKeySelector}
            renderer={CheckButton}
            rendererParams={cellRendererParams}
            filtered={false}
            pending={false}
            errored={false}
        />
    );
}

export default OrganigramTagInput;
