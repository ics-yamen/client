import PropTypes from 'prop-types';
import React from 'react';
import {
    Switch,
    Route,
    withRouter,
} from 'react-router-dom';
import { connect } from 'react-redux';

import ExclusivelyPublicRoute from '#rscg/ExclusivelyPublicRoute';
import PrivateRoute from '#rscg/PrivateRoute';
import Toast from '#rscv/Toast';

import RouteSynchronizer from '#components/general/RouteSynchronizer';
import Navbar from '#components/general/Navbar';

import { mapObjectToObject } from '#utils/common';
import BrowserWarning from '#components/general/BrowserWarning';

import {
    pathNames,
    routesOrder,
    routes,
} from '#constants';

import { setTheme } from '#theme';

import {
    authenticatedSelector,
    lastNotifySelector,
    notifyHideAction,
    currentThemeIdSelector,
} from '#redux';

import styles from './styles.scss';

const ROUTE = {
    exclusivelyPublic: 'exclusively-public',
    public: 'public',
    private: 'private',
};

const propTypes = {
    authenticated: PropTypes.bool.isRequired,
    lastNotify: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
    notifyHide: PropTypes.func.isRequired,
};

const mapStateToProps = state => ({
    currentThemeId: currentThemeIdSelector(state),
    authenticated: authenticatedSelector(state),
    lastNotify: lastNotifySelector(state),
});

const mapDispatchToProps = dispatch => ({
    notifyHide: params => dispatch(notifyHideAction(params)),
});


const views = mapObjectToObject(
    routes,
    (route, name) => props => (
        <RouteSynchronizer
            {...props}
            load={route.loader}
            path={route.path}
            name={name}
        />
    ),
);

// NOTE: withRouter is required here so that link change are updated
@withRouter
@connect(mapStateToProps, mapDispatchToProps)
export default class Multiplexer extends React.PureComponent {
    static propTypes = propTypes;

    componentDidMount() {
        const { currentThemeId } = this.props;
        // window.onunload = this.props.removeSelfTabStatus;

        setTheme(currentThemeId);
    }

    handleToastClose = () => {
        const { notifyHide } = this.props;
        notifyHide();
    }

    renderRoute = (routeId) => {
        const view = views[routeId];
        if (!view) {
            console.error(`Cannot find view associated with routeID: ${routeId}`);
            return null;
        }

        const path = pathNames[routeId];
        const { redirectTo, type } = routes[routeId];
        const { authenticated } = this.props;

        switch (type) {
            case ROUTE.exclusivelyPublic:
                return (
                    <ExclusivelyPublicRoute
                        component={view}
                        key={routeId}
                        path={path}
                        exact
                        authenticated={authenticated}
                        redirectLink={redirectTo}
                    />
                );
            case ROUTE.private:
                return (
                    <PrivateRoute
                        component={view}
                        key={routeId}
                        path={path}
                        exact
                        authenticated={authenticated}
                        redirectLink={redirectTo}
                    />
                );
            case ROUTE.public:
                return (
                    <Route
                        component={view}
                        key={routeId}
                        path={path}
                        exact
                    />
                );
            default:
                console.error(`Invalid route type ${type}`);
                return null;
        }
    }

    render() {
        const {
            lastNotify,
        } = this.props;

        return (
            <>
                <BrowserWarning />
                <Navbar className="navbar" />
                <Toast
                    notification={lastNotify}
                    onClose={this.handleToastClose}
                />
                <div className="deep-main-content">
                    <Switch>
                        { routesOrder.map(this.renderRoute) }
                    </Switch>
                </div>
            </>
        );
    }
}
