from django.core.management.base import BaseCommand
from sports.thesportsdb_client import thesportsdb_client
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Check TheSportsDB API health and circuit breaker status'

    def handle(self, *args, **options):
        self.stdout.write('Checking TheSportsDB API Health...\n')

        # Check circuit breaker status
        circuit_status = thesportsdb_client.get_circuit_status()
        self.stdout.write(f"Circuit Breaker Status: {'OPEN' if circuit_status['circuit_open'] else 'CLOSED'}")
        self.stdout.write(f"Failure Count: {circuit_status['failure_count']}")
        self.stdout.write(f"Requests This Minute: {circuit_status['requests_this_minute']}")
        self.stdout.write(f"Requests This Hour: {circuit_status['requests_this_hour']}")

        if circuit_status['last_failure']:
            self.stdout.write(f"Last Failure: {circuit_status['last_failure']}")

        self.stdout.write('')

        # Test API connectivity
        self.stdout.write('Testing API Connectivity...')
        try:
            is_healthy = thesportsdb_client.health_check()
            if is_healthy:
                self.stdout.write(
                    self.style.SUCCESS('SUCCESS: API is healthy and responding')
                )
            else:
                self.stdout.write(
                    self.style.ERROR('ERROR: API health check failed')
                )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'ERROR: API health check error: {e}')
            )

        # Test a sample endpoint
        self.stdout.write('\nTesting Sample Endpoint (Soccer Leagues)...')
        try:
            leagues_data = thesportsdb_client.search_leagues('Soccer')
            if leagues_data and 'countrys' in leagues_data:
                league_count = len(leagues_data['countrys'])
                self.stdout.write(
                    self.style.SUCCESS(f'SUCCESS: Successfully fetched {league_count} soccer leagues')
                )
            else:
                self.stdout.write(
                    self.style.WARNING('WARNING: No leagues data returned')
                )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'ERROR: Failed to fetch leagues: {e}')
            )

        self.stdout.write('\nHealth check complete.')