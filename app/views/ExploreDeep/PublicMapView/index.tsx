import React, { useState, useCallback, useMemo } from 'react';
import {
    _cs,
    isDefined,
} from '@togglecorp/fujs';
import { useQuery, gql } from '@apollo/client';
import {
    PendingMessage,
} from '@the-deep/deep-ui';
import Map, {
    MapContainer,
    MapSource,
    MapLayer,
} from '@togglecorp/re-map';
import {
    MapboxGeoJSONFeature,
    LngLat,
    MapboxOptions,
} from 'mapbox-gl';

import {
    PublicProjectsByRegionQuery,
    PublicProjectsByRegionQueryVariables,
    PublicProjectDetailsForMapViewQuery,
    PublicProjectDetailsForMapViewQueryVariables,
    ProjectListQueryVariables,
} from '#generated/types';
import { mapboxStyle } from '#base/configs/env';
import { convertDateToIsoDateTime } from '#utils/common';

import ProjectList from './ProjectList';
import styles from './styles.css';

const sourceOptions: mapboxgl.GeoJSONSourceRaw & { clusterProperties: unknown } = {
    type: 'geojson',
    cluster: true,
    clusterRadius: 100,
    clusterProperties: {},
};

const white = '#ffffff';

const clusterPointCirclePaint: mapboxgl.CirclePaint = {
    'circle-radius': 16,
    'circle-color': '#1a3ed0',
};

const clusterPointTextPaint: mapboxgl.SymbolPaint = {
    'text-color': white,
    'text-halo-width': 0,
};

const clusterPointTextLayout: mapboxgl.SymbolLayout = {
    visibility: 'visible',
    'symbol-sort-key': [
        'case',
        ['has', 'point_count'],
        ['-', ['get', 'point_count']],
        -1,
    ],
    'text-field': [
        'case',
        ['has', 'point_count'],
        ['get', 'point_count_abbreviated'],
        '1',
    ],
    'text-size': 15,
};

export const visibleLayout: mapboxgl.LineLayout = {
    visibility: 'visible',
};

const mapOptions: Partial<MapboxOptions> = {
    zoom: 2,
    center: [50, 10],
};

const PROJECT_LIST = gql`
    query PublicProjectsByRegion(
        $projectFilter: RegionProjectFilterData,
    ) {
        publicProjectsByRegion(
            projectFilter: $projectFilter,
        ) {
            results {
                centroid
                id
                projectsId
            }
        }
    }
`;

const PROJECT_DETAILS = gql`
    query PublicProjectDetailsForMapView(
        $projectIdList: [ID!]
        $page: Int
        $pageSize: Int
    ) {
        publicProjects(
            ids: $projectIdList,
            page: $page,
            pageSize: $pageSize,
        ) {
            page
            pageSize
            totalCount
            results {
                id
                title
                description
                createdAt
                numberOfUsers
                numberOfLeads
                numberOfEntries
                analysisFrameworkTitle
                analysisFrameworkPreviewImage
            }
        }
    }
`;

export type Project = NonNullable<NonNullable<NonNullable<PublicProjectsByRegionQuery['publicProjectsByRegion']>['results']>[number]>;

interface Props {
    className?: string;
    filters: ProjectListQueryVariables | undefined;
}

function ExploreDeepMapView(props: Props) {
    const {
        className,
        filters,
    } = props;

    // FIXME: rename startDate to createdAtGte
    // FIXME: rename endDate to createdAtLte
    const variables = useMemo(() => ({
        projectFilter: {
            ...filters,
            startDate: convertDateToIsoDateTime(filters?.startDate),
            endDate: convertDateToIsoDateTime(filters?.endDate, { endOfDay: true }),
        },
    }), [filters]);

    const {
        data,
        loading,
    } = useQuery<PublicProjectsByRegionQuery, PublicProjectsByRegionQueryVariables>(
        PROJECT_LIST,
        {
            variables,
        },
    );

    const [clickedFeatureProperties, setClickedFeatureProperties] = useState<string[]>([]);
    const [clusterClicked, setClusterClicked] = useState(false);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);

    const projectDetailsVariables = useMemo(
        () => ({
            projectIdList: clickedFeatureProperties,
            page,
            pageSize,
        }),
        [clickedFeatureProperties, page, pageSize],
    );

    const {
        previousData,
        data: projectDetails = previousData,
        loading: projectDetailsPending,
    } = useQuery<PublicProjectDetailsForMapViewQuery, PublicProjectDetailsForMapViewQueryVariables>(
        PROJECT_DETAILS,
        {
            variables: projectDetailsVariables,
        },
    );

    const geoJson: GeoJSON.FeatureCollection<GeoJSON.Point> | undefined = useMemo(() => {
        if (!data) {
            return undefined;
        }
        const projects = data.publicProjectsByRegion?.results?.map((projectByRegion) => (
            projectByRegion.projectsId?.map((project) => ({
                id: project,
                type: 'Feature' as const,
                geometry: projectByRegion.centroid as GeoJSON.Point,
                properties: {
                    id: project,
                    projectId: project,
                },
            }))
        )).flat().filter(isDefined);

        return ({
            type: 'FeatureCollection',
            features: projects ?? [],
        });
    }, [data]);

    const handleClick = useCallback((
        feature: MapboxGeoJSONFeature,
        _: LngLat,
        __: mapboxgl.Point,
        map: mapboxgl.Map,
    ) => {
        interface ClusterProperties {

            cluster_id: number;

            point_count: number;
        }

        if (feature.properties) {
            // eslint-disable-next-line camelcase
            const { cluster_id, point_count } = feature.properties as ClusterProperties;
            const clusterSource = map.getSource('region') as mapboxgl.GeoJSONSource;
            if (clusterSource) {
                clusterSource.getClusterLeaves(
                    cluster_id,
                    point_count,
                    0,
                    (___, aFeatures) => {
                        if (aFeatures) {
                            const projectIds = aFeatures
                                .map((f) => f?.properties?.projectId)
                                .filter(isDefined);
                            setClickedFeatureProperties(projectIds);
                        }
                    },
                );
            }

            if (feature.properties.projectId) {
                setClickedFeatureProperties([feature.properties.projectId]);
            } else {
                setClickedFeatureProperties([]);
            }
        }
        setClusterClicked(!clusterClicked);
        return true;
    }, [clusterClicked]);

    const handleListClose = useCallback(() => {
        setClusterClicked(false);
    }, []);

    return (
        <div className={_cs(className, styles.mapView)}>
            {clusterClicked && (
                <ProjectList
                    projectDetails={projectDetails?.publicProjects?.results ?? undefined}
                    onListCloseButtonClick={handleListClose}
                    page={page}
                    pageSize={pageSize}
                    setPage={setPage}
                    setPageSize={setPageSize}
                    projectDetailsPending={projectDetailsPending}
                    totalCount={projectDetails?.publicProjects?.totalCount ?? 0}
                />
            )}
            {loading && (<PendingMessage />)}
            <Map
                mapStyle={mapboxStyle}
                mapOptions={mapOptions}
                scaleControlShown={false}
                navControlShown={false}
            >
                <MapContainer className={styles.map} />
                <MapSource
                    sourceKey="region"
                    sourceOptions={sourceOptions}
                    geoJson={geoJson}
                >
                    <MapLayer
                        layerKey="cases-cluster-background"
                        layerOptions={{
                            type: 'circle',
                            paint: clusterPointCirclePaint,
                            layout: visibleLayout,
                        }}
                        onClick={handleClick}
                    />
                    <MapLayer
                        layerKey="cases-cluster-number"
                        layerOptions={{
                            type: 'symbol',
                            paint: clusterPointTextPaint,
                            layout: clusterPointTextLayout,
                        }}
                    />
                </MapSource>
            </Map>
        </div>
    );
}

export default ExploreDeepMapView;