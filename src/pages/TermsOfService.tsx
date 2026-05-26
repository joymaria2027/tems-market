import Layout from "@/components/layout/Layout";

const TermsOfService = () => (
  <Layout>
    <div className="container py-12 md:py-20 max-w-3xl mx-auto">
      <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-8">
        Terms of Service
      </h1>
      <div className="prose prose-sm text-muted-foreground space-y-6">
        <p className="text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
        </p>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">1. Acceptance of Terms</h2>
          <p>
            By accessing or using Tems Market, you agree to be bound by these Terms of Service.
            If you do not agree to these terms, please do not use our platform.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">2. Eligibility</h2>
          <p>
            You must be at least 18 years old to create an account on Tems Market. By registering,
            you confirm that you meet this age requirement and that the information you provide is
            accurate and complete.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">3. User Accounts</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account credentials and
            for all activities that occur under your account. Vendor accounts require identity
            verification and are subject to approval.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">4. Marketplace Transactions</h2>
          <p>
            Tems Market facilitates transactions between vendors and customers. Vendors set their
            own prices and are responsible for the quality and accuracy of their product listings.
            All payments are processed through ModemPay.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">5. Credits &amp; Payments</h2>
          <p>
            Tems Market credits are non-withdrawable, non-transferable store credit valued at
            1 credit = GMD 1. Credits can be used only for purchases on the platform. Vendor and
            affiliate commissions are paid out through ModemPay as commercial accounts payable.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">6. Prohibited Conduct</h2>
          <p>
            You may not use Tems Market for any unlawful purpose, to sell prohibited items, to
            misrepresent your identity, or to interfere with the platform's operation. We reserve
            the right to suspend or terminate accounts that violate these terms.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">7. Limitation of Liability</h2>
          <p>
            Tems Market is provided "as is" without warranties of any kind. We are not liable
            for disputes between buyers and sellers, product quality, or delivery issues beyond
            our reasonable control.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">8. Contact</h2>
          <p>
            For questions about these Terms of Service, contact us at{" "}
            <span className="font-medium text-foreground">legal@temsmarket.com</span>.
          </p>
        </section>
      </div>
    </div>
  </Layout>
);

export default TermsOfService;
