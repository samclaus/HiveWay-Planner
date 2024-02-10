<script lang="ts">
    import { MY_INFO$ } from "../../state/session";
    import { BREADCRUMBS } from "../Breadcrumbs.svelte";
    import { cardLink } from "../actions/card-link";

    BREADCRUMBS.set([]);
</script>

<main class="padding-heavy">

    <h1>Welcome, {$MY_INFO$.name}!</h1>

    <ul class="card-grid">
        <li class="card" use:cardLink>
            <h3><a data-card-link href="#/projects">Projects</a></h3>
            <p class="flex-grow">
                Projects are the bread-and-butter of this application.
                Each project contains a set of stops and routes,
                miscellaneous map geometry (e.g., to display census
                data), and can be published as the main/current GTFS Schedule
                data set for transit consumers.
            </p>
        </li>
        <li class="card" use:cardLink>
            <h3><a data-card-link href="#/users">Users</a></h3>
            <p class="flex-grow">
                View all the users in the system.
            </p>
        </li>
        <li class="card" use:cardLink>
            <h3><a data-card-link href="#/registration-tokens">Registration Tokens</a></h3>
            <p class="flex-grow">
                Registration tokens are single-use passwords that
                allow new users to register. Create one and
                distribute it via email or another secure medium
                when onboarding a user.
            </p>
        </li>
    </ul>

</main>
